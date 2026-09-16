import api, { route } from "@forge/api";
import { kvs } from "@forge/kvs";
import Resolver from "@forge/resolver";

interface ColumnDef {
  id: string;
  label: string;
  type: "text" | "number";
}

const resolver = new Resolver();

// Helper: Verify if current user is a Jira Global Admin
async function isGlobalAdmin(): Promise<boolean> {
  try {
    const res = await api
      .asUser()
      .requestJira(route`/rest/api/3/mypermissions?permissions=ADMINISTER`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.permissions?.ADMINISTER?.havePermission ?? false;
  } catch {
    return false;
  }
}

// Helper: Verify if current user can administer a specific project
async function canAdminProject(projectId: string): Promise<boolean> {
  try {
    const res = await api
      .asUser()
      .requestJira(
        route`/rest/api/3/mypermissions?permissions=ADMINISTER_PROJECTS&projectId=${projectId}`,
      );
    if (!res.ok) return false;
    const data = await res.json();
    return data.permissions?.ADMINISTER_PROJECTS?.havePermission ?? false;
  } catch {
    return false;
  }
}

// Helper to safely fetch columns as an array
async function getStoredColumns(): Promise<ColumnDef[]> {
  const data = await kvs.get("custom_columns");
  return Array.isArray(data) ? (data as ColumnDef[]) : [];
}

resolver.define("getColumns", async () => {
  return await getStoredColumns();
});

resolver.define("addColumn", async ({ payload }) => {
  if (!(await isGlobalAdmin())) {
    throw new Error(
      "Unauthorized: Only Jira Administrators can add custom columns.",
    );
  }

  const columns = await getStoredColumns();
  const newCol = payload as ColumnDef;

  // Check if a column with the same ID already exists
  const exists = columns.some((col) => col.id === newCol.id);
  if (exists) {
    throw new Error(`A column with key "${newCol.id}" already exists.`);
  }

  const updated = [...columns, newCol];
  await kvs.set("custom_columns", updated);
  return updated;
});

resolver.define("deleteColumn", async ({ payload }) => {
  if (!(await isGlobalAdmin())) {
    throw new Error(
      "Unauthorized: Only Jira Administrators can delete columns.",
    );
  }

  const { columnId } = payload as { columnId: string };
  const columns = await getStoredColumns();
  const updated = columns.filter((col) => col.id !== columnId);
  await kvs.set("custom_columns", updated);
  return updated;
});

resolver.define("getProjectsWithProperties", async () => {
  const columns = await getStoredColumns();
  const propertyKeys = columns.map((col) => col.id).join(",");

  const endpoint = route`/rest/api/3/project/search?expand=lead,projectCategory,insight&properties=${propertyKeys}`;

  const projectsRes = await api.asUser().requestJira(endpoint);
  if (!projectsRes.ok)
    throw new Error(`Failed to fetch projects: ${projectsRes.status}`);

  const projectsData = await projectsRes.json();
  const projects = Array.isArray(projectsData.values)
    ? projectsData.values
    : [];

  const isGlobal = await isGlobalAdmin();

  // Evaluate project-level edit rights per project
  const projectsWithPermissions = await Promise.all(
    projects.map(async (project: any) => {
      const canEdit = isGlobal || (await canAdminProject(project.id));
      return {
        ...project,
        canEdit,
      };
    }),
  );

  return {
    projects: projectsWithPermissions,
    columns,
    userPermissions: {
      canManageColumns: isGlobal,
    },
  };
});

resolver.define("updateProjectProperty", async ({ payload }) => {
  const { projectId, key, value } = payload as {
    projectId: string;
    key: string;
    value: any;
  };

  const isGlobal = await isGlobalAdmin();
  const canEdit = isGlobal || (await canAdminProject(projectId));

  if (!canEdit) {
    throw new Error(
      "Unauthorized: You do not have permission to edit this project.",
    );
  }

  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/project/${projectId}/properties/${key}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    });

  return response.ok;
});

resolver.define("getDebugStorage", async () => {
  const results = await kvs.query().getMany();
  return results;
});

export const handler = resolver.getDefinitions();
export const run = handler;
