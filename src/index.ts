import api, { route } from "@forge/api";
import { kvs, Sort } from "@forge/kvs";
import Resolver from "@forge/resolver";

interface ColumnDef {
  id: string;
  label: string;
  type: "text" | "number";
}

const CONSOLIDATED_KEY = "workspace_fields";

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

// Helper to safely get stored columns array
async function getStoredColumns(): Promise<any[]> {
  const stored: any = await kvs.get("custom_columns");
  if (Array.isArray(stored)) return stored;

  if (stored && Array.isArray(stored.results)) return stored.results;
  return [];
}

async function logAuditEvent(
  context: any,
  action: string,
  details: {
    projectId?: string;
    slotKey?: string;
    oldValue?: any;
    newValue?: any;
  },
) {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Ensure NO attribute receives an empty string ("")
    await kvs.entity("audit_log").set(logId, {
      timestamp: new Date().toISOString(),
      accountId: context?.accountId || "N/A",
      action,
      projectId:
        details.projectId && details.projectId.trim() !== ""
          ? details.projectId
          : "GLOBAL",
      slotKey:
        details.slotKey && details.slotKey.trim() !== ""
          ? details.slotKey
          : "N/A",
      oldValue:
        details.oldValue !== undefined &&
        details.oldValue !== null &&
        String(details.oldValue).trim() !== ""
          ? String(details.oldValue)
          : "none",
      newValue:
        details.newValue !== undefined &&
        details.newValue !== null &&
        String(details.newValue).trim() !== ""
          ? String(details.newValue)
          : "none",
    });

    console.log(`[AUDIT LOG SUCCESS] Event ${action} recorded.`);
  } catch (err) {
    console.error("Failed to write audit log entity:", err);
  }
}

// Helper to determine the next available slot key based on type
function allocateSlotKey(existingColumns: any[], type: string): string {
  let prefix = "text_slot_";
  let maxSlots = 40;

  if (type === "number") {
    prefix = "number_slot_";
    maxSlots = 20;
  } else if (type === "date") {
    prefix = "date_slot_";
    maxSlots = 20;
  } else if (type === "user") {
    prefix = "user_slot_";
    maxSlots = 20;
  }

  const usedSlots = new Set(
    existingColumns
      .map((col) => col.slotKey)
      .filter((slot) => slot && slot.startsWith(prefix)),
  );

  for (let i = 1; i <= maxSlots; i++) {
    const candidate = `${prefix}${i}`;
    if (!usedSlots.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No available ${type} slots remaining (Limit reached).`);
}

resolver.define("getColumns", async () => {
  return await getStoredColumns();
});

// Updated addColumn resolver
resolver.define("addColumn", async ({ payload, context }) => {
  const { label, type } = payload as { label: string; type: string };
  const existingColumns = await getStoredColumns();

  const slotKey = allocateSlotKey(existingColumns, type);
  const newColumn = {
    id: slotKey,
    slotKey,
    label,
    type,
  };

  const updatedColumns = [...existingColumns, newColumn];
  await kvs.set("custom_columns", updatedColumns);

  await logAuditEvent(context, "COLUMN_CREATED", {
    slotKey,
  });

  return updatedColumns;
});

resolver.define("deleteColumn", async ({ payload, context }) => {
  if (!(await isGlobalAdmin())) {
    throw new Error(
      "Unauthorized: Only Jira Administrators can delete columns.",
    );
  }

  const { columnId } = payload as { columnId: string };
  const columns = await getStoredColumns();
  const targetColumn = columns.find((col) => col.id === columnId);
  const updated = columns.filter((col) => col.id !== columnId);
  await kvs.set("custom_columns", updated);

  await logAuditEvent(context, "COLUMN_DELETED", {
    slotKey: targetColumn?.slotKey,
  });

  return updated;
});

resolver.define("getProjectsWithProperties", async () => {
  const columns = await getStoredColumns();

  const endpoint = route`/rest/api/3/project/search?expand=lead,projectCategory,insight&properties=${CONSOLIDATED_KEY}`;

  const projectsRes = await api.asUser().requestJira(endpoint);
  if (!projectsRes.ok)
    throw new Error(`Failed to fetch projects: ${projectsRes.status}`);

  const projectsData = await projectsRes.json();
  const projects = Array.isArray(projectsData.values)
    ? projectsData.values
    : [];

  const isGlobal = await isGlobalAdmin();

  const projectsWithPermissions = await Promise.all(
    projects.map(async (project: any) => {
      const canEdit = isGlobal || (await canAdminProject(project.id));
      let completedIssueCount = 0;

      try {
        const countRes = await api
          .asUser()
          .requestJira(route`/rest/api/3/search/approximate-count`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jql: `project = "${project.key}" AND status IN ("Done", "Resolved", "Closed")`,
            }),
          });
        if (countRes.ok) {
          const countData = await countRes.json();
          completedIssueCount = countData.count ?? 0;
        }
      } catch {
        completedIssueCount = 0;
      }

      return {
        ...project,
        properties: project.properties?.[CONSOLIDATED_KEY] || {},
        canEdit,
        insight: {
          totalIssueCount: project.insight?.totalIssueCount ?? 0,
          completedIssueCount,
        },
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

resolver.define("getDebugStorage", async () => {
  const results = await kvs.query().getMany();
  return results;
});

resolver.define("searchJiraUsers", async (req) => {
  const { query } = req.payload;
  const searchParam =
    query && query.trim().length > 0 ? encodeURIComponent(query.trim()) : "";

  const res = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/user/search?query=${searchParam}&maxResults=10`,
    );

  if (!res.ok) return [];
  const users = await res.json();

  return users
    .filter((u: any) => u.accountType === "atlassian") // Exclude bots/apps
    .map((u: any) => ({
      accountId: u.accountId,
      displayName: u.displayName,
      avatarUrl: u.avatarUrls?.["24x24"] || "",
    }));
});

resolver.define("clearAllProjectProperties", async () => {
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/project/search?maxResults=100`);

  if (!res.ok) return false;
  const data = await res.json();
  const projects = data.values || [];

  for (const project of projects) {
    await api
      .asUser()
      .requestJira(
        route`/rest/api/3/project/${project.id}/properties/${CONSOLIDATED_KEY}`,
        { method: "DELETE" },
      );

    const keysRes = await api
      .asUser()
      .requestJira(route`/rest/api/3/project/${project.id}/properties`);

    if (keysRes.ok) {
      const { keys } = await keysRes.json();
      for (const item of keys || []) {
        if (item.key.startsWith("custom_") || item.key === CONSOLIDATED_KEY) {
          await api
            .asUser()
            .requestJira(
              route`/rest/api/3/project/${project.id}/properties/${item.key}`,
              { method: "DELETE" },
            );
        }
      }
    }
  }

  return true;
});

resolver.define("updateProjectProperty", async ({ payload, context }) => {
  const { projectId, key, value } = payload as {
    projectId: string;
    key: string;
    value: any;
  };

  const getResponse = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/project/${projectId}/properties/${CONSOLIDATED_KEY}`,
    );

  let currentData: Record<string, any> = {};
  if (getResponse.ok) {
    const json = await getResponse.json();
    currentData = json.value || {};
  }

  const oldValue = currentData[key] ?? "";

  const updatedData = {
    ...currentData,
    [key]: value,
  };

  await logAuditEvent(context, "VALUE_UPDATED", {
    projectId,
    slotKey: key,
    oldValue,
    newValue: value,
  });

  const putResponse = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/project/${projectId}/properties/${CONSOLIDATED_KEY}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      },
    );

  return putResponse.ok;
});

resolver.define("clearAuditLogs", async () => {
  const isGlobal = await isGlobalAdmin();
  if (!isGlobal) throw new Error("Unauthorized");

  try {
    let deletedCount = 0;
    let hasMore = true;

    // Loop until all pages of entity records are deleted
    while (hasMore) {
      const queryResult = await kvs
        .entity("audit_log")
        .query()
        .index("by-timestamp") // Must specify entity index name from manifest.yml
        .limit(100)
        .getMany();

      if (!queryResult.results || queryResult.results.length === 0) {
        hasMore = false;
        break;
      }

      // Delete the current page of records in parallel
      const deletePromises = queryResult.results.map((record) =>
        kvs.entity("audit_log").delete(record.key),
      );
      await Promise.all(deletePromises);

      deletedCount += queryResult.results.length;

      // Stop if there are no more records to process
      if (queryResult.results.length < 100) {
        hasMore = false;
      }
    }

    console.log(
      `[AUDIT LOGS CLEARED] Successfully deleted ${deletedCount} audit records.`,
    );
    return true;
  } catch (err) {
    console.error("Failed to clear audit logs:", err);
    throw new Error("Failed to clear audit logs.");
  }
});

resolver.define("getAuditLogs", async () => {
  const isGlobal = await isGlobalAdmin();
  if (!isGlobal) throw new Error("Unauthorized");

  const queryResult = await kvs
    .entity("audit_log")
    .query()
    .index("by-timestamp")
    .sort(Sort.DESC)
    .limit(100)
    .getMany();

  return queryResult.results.map((r) => r.value);
});

export const handler = resolver.getDefinitions();
export const run = handler;
