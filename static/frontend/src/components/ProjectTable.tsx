import React, { useState, useMemo } from "react";
import { Project, ColumnDef } from "../hooks/useProjects";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Lock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { router } from "@forge/bridge";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

interface ProjectTableProps {
  projects: Project[];
  columns: ColumnDef[];
  canManageColumns: boolean;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onUpdatePropertyValue: (projectId: string, key: string, value: any) => void;
  onDeleteColumn: (columnId: string, label: string) => Promise<boolean>;
}

export function ProjectTable({
  projects,
  columns,
  canManageColumns,
  loading,
  error,
  searchQuery,
  onUpdatePropertyValue,
  onDeleteColumn,
}: ProjectTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [columnToDelete, setColumnToDelete] = useState<ColumnDef | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const handleConfirmDelete = async () => {
    if (!columnToDelete) return;
    setIsDeleting(true);
    await onDeleteColumn(columnToDelete.id, columnToDelete.label);
    setIsDeleting(false);
    setColumnToDelete(null);
  };

  const processedProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const keyMatch = p.key?.toLowerCase().includes(q);
        const leadMatch = p.lead?.displayName?.toLowerCase().includes(q);
        const customPropMatch = Object.values(p.properties || {}).some((val) =>
          String(val || "")
            .toLowerCase()
            .includes(q),
        );
        return nameMatch || keyMatch || leadMatch || customPropMatch;
      });
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = "";
        let bValue: any = "";
        if (sortConfig.key === "totalIssueCount") {
          aValue = a.insight?.totalIssueCount ?? 0;
          bValue = b.insight?.totalIssueCount ?? 0;
        } else if (sortConfig.key === "lead") {
          aValue = a.lead?.displayName || "";
          bValue = b.lead?.displayName || "";
        } else if (sortConfig.key in a) {
          aValue = (a as any)[sortConfig.key] || "";
          bValue = (b as any)[sortConfig.key] || "";
        } else {
          aValue = a.properties?.[sortConfig.key] || "";
          bValue = b.properties?.[sortConfig.key] || "";
        }
        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue), undefined, {
              numeric: true,
              sensitivity: "base",
            })
          : String(bValue).localeCompare(String(aValue), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      });
    }

    return result;
  }, [projects, searchQuery, sortConfig]);

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key)
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  const renderCellInput = (col: ColumnDef, project: Project) => {
    const value = project.properties?.[col.id];
    const canEdit = project.canEdit ?? false;

    if (col.type === "boolean") {
      return (
        <div className="flex items-center justify-center h-8">
          <input
            type="checkbox"
            disabled={!canEdit}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            checked={Boolean(value)}
            onChange={(e) =>
              onUpdatePropertyValue(project.id, col.id, e.target.checked)
            }
          />
        </div>
      );
    }

    return (
      <Input
        type={
          col.type === "number"
            ? "number"
            : col.type === "date"
              ? "date"
              : "text"
        }
        disabled={!canEdit}
        className={`h-8 text-xs transition-all ${
          !canEdit
            ? "bg-slate-50 text-slate-400 border-transparent cursor-not-allowed"
            : "border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent focus:bg-white"
        }`}
        value={value ?? ""}
        placeholder={canEdit ? "Add value..." : ""}
        onChange={(e) =>
          onUpdatePropertyValue(
            project.id,
            col.id,
            col.type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value,
          )
        }
      />
    );
  };

  const totalColumnCount = 5 + columns.length;

  return (
    <>
      <div className="border rounded-lg bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-[120px]">
                <button
                  className="flex items-center gap-1.5 font-semibold text-slate-700"
                  onClick={() => handleSort("key")}
                >
                  Key {renderSortIcon("key")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 font-semibold text-slate-700"
                  onClick={() => handleSort("name")}
                >
                  Project Name {renderSortIcon("name")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 font-semibold text-slate-700"
                  onClick={() => handleSort("projectTypeKey")}
                >
                  Type {renderSortIcon("projectTypeKey")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 font-semibold text-slate-700"
                  onClick={() => handleSort("lead")}
                >
                  Lead {renderSortIcon("lead")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort("totalIssueCount")}
                >
                  Work Items {renderSortIcon("totalIssueCount")}
                </button>
              </TableHead>

              {columns.map((col) => (
                <TableHead key={col.id} className="min-w-[180px]">
                  <div className="flex items-center justify-between group/head pr-1">
                    <button
                      className="flex items-center gap-1.5 font-semibold text-slate-900"
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label} {renderSortIcon(col.id)}
                    </button>

                    {/* Show delete button only if user has column management rights */}
                    {canManageColumns && (
                      <button
                        onClick={() => setColumnToDelete(col)}
                        className="opacity-0 group-hover/head:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1 rounded hover:bg-red-50"
                        title="Delete column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    {Array.from({ length: totalColumnCount }).map((_, cIdx) => (
                      <TableCell key={cIdx}>
                        <div className="h-4 bg-slate-200 rounded w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : processedProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-slate-600">
                      <button
                        type="button"
                        onClick={() =>
                          router.open(
                            `/jira/servicedesk/projects/${project.key}`,
                          )
                        }
                        className="bg-slate-100 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 border px-2 py-0.5 rounded transition-all cursor-pointer text-left"
                        title={`Open ${project.name} in Jira`}
                      >
                        {project.key}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                      {project.name}
                      {!project.canEdit && (
                        <Lock className="w-3 h-3 text-slate-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 capitalize">
                      {project.projectTypeKey?.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {project.lead?.displayName || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">
                      <span className="bg-slate-100 border px-2 py-0.5 rounded font-medium">
                        {project.insight?.totalIssueCount ?? 0} issues
                      </span>
                    </TableCell>

                    {columns.map((col) => (
                      <TableCell key={col.id} className="p-2">
                        {renderCellInput(col, project)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!columnToDelete}
        onOpenChange={(open) => !open && setColumnToDelete(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                "{columnToDelete?.label}"
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setColumnToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Column"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
