import { useState, useEffect, useCallback } from "react";
import { invoke } from "@forge/bridge";
import { toast } from "sonner";

export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "user"
  | "url";

export interface ColumnDef {
  slotKey: string;
  id: string;
  label: string;
  type: ColumnType;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  lead?: { displayName: string };
  properties?: Record<string, any>;
  canEdit?: boolean;
  insight?: {
    totalIssueCount: number;
    lastIssueUpdateTime?: string;
    completedIssueCount: number;
  };
}

export interface UserPermissions {
  canManageColumns: boolean;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions>({
    canManageColumns: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await invoke("getProjectsWithProperties")) as {
        projects: Project[];
        columns: ColumnDef[];
        userPermissions: UserPermissions;
      };
      setProjects(res.projects);
      setColumns(res.columns);
      setPermissions(res.userPermissions || { canManageColumns: false });
    } catch (err) {
      console.error(err);
      setError("Failed to fetch projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addColumn = async (
    label: string,
    type: ColumnType,
  ): Promise<boolean> => {
    const normalizedLabel = label.trim().toLowerCase();

    // 1. Check for duplicates using display label
    if (columns.some((c) => c.label.trim().toLowerCase() === normalizedLabel)) {
      toast.error(`A field named "${label}" already exists.`);
      return false;
    }

    try {
      // 2. Pass only label and type; backend allocates the indexed slot key
      const updatedCols = (await invoke("addColumn", {
        label,
        type,
      })) as ColumnDef[];

      // 3. Ensure response is an array before setting state
      if (Array.isArray(updatedCols)) {
        setColumns(updatedCols);
      } else {
        await fetchData(); // Fallback if backend returned single item
      }

      toast.success(`Custom field "${label}" created.`);
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Failed to create field.");
      return false;
    }
  };;

  const deleteColumn = async (
    columnId: string,
    label: string,
  ): Promise<boolean> => {
    try {
      const updatedCols = (await invoke("deleteColumn", {
        columnId,
      })) as ColumnDef[];
      setColumns(updatedCols);
      toast.success(`Column "${label}" deleted.`);
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete column.");
      return false;
    }
  };

  const updatePropertyValue = async (
    projectId: string,
    key: string,
    value: any,
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, properties: { ...p.properties, [key]: value } }
          : p,
      ),
    );

    try {
      await invoke("updateProjectProperty", { projectId, key, value });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save project property update.");
      fetchData();
    }
  };

  const clearAllProperties = async (): Promise<boolean> => {
    try {
      const success = (await invoke("clearAllProjectProperties")) as boolean;
      if (success) {
        await fetchData(); // Refresh frontend state
      }
      return success;
    } catch (err) {
      console.error("Failed to clear project properties:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    projects,
    columns,
    permissions,
    loading,
    error,
    addColumn,
    deleteColumn,
    updatePropertyValue,
    refetch: fetchData,
    clearAllProperties,
  };
}
