import React, { useState, useMemo } from "react";
import { Project, ColumnDef } from "../hooks/useProjects";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Lock,
  Download,
  Printer,
  Search,
  SearchX,
  Check,
  Copy,
} from "lucide-react";
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

import { ProjectProgressBar } from "./ProjectProgressBar";
import { DynamicCell } from "./DynamicCell";
import { downloadProjectsCSV } from "../lib/csv";
import { toast } from "sonner";

type SortConfig = { key: string; direction: "asc" | "desc" } | null;

interface ProjectTableProps {
  projects: Project[];
  columns: ColumnDef[];
  canManageColumns: boolean;
  loading: boolean;
  error: string | null;
  onUpdatePropertyValue: (projectId: string, key: string, value: any) => void;
  onDeleteColumn: (columnId: string, label: string) => Promise<boolean>;
}

// Helper to convert slot keys (e.g., "text_slot_1") to JQL aliases ("TextSlot1")
const getJqlAlias = (slotKey: string) => {
  return slotKey
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
};

export function ProjectTable({
  projects,
  columns,
  canManageColumns,
  loading,
  onUpdatePropertyValue,
  onDeleteColumn,
}: ProjectTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [columnToDelete, setColumnToDelete] = useState<ColumnDef | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyJql = (col: any) => {
    const slotKey = col.slotKey || col.id;
    const jqlSnippet = `project.${getJqlAlias(slotKey)}`;

    navigator.clipboard.writeText(jqlSnippet);
    toast.success(`Copied "${jqlSnippet}" to clipboard!`);

    setCopiedId(col.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        if (sortConfig.key === "progress") {
          const aTotal = a.insight?.totalIssueCount ?? 0;
          const aDone = a.insight?.completedIssueCount ?? 0;
          const bTotal = b.insight?.totalIssueCount ?? 0;
          const bDone = b.insight?.completedIssueCount ?? 0;
          aValue = aTotal > 0 ? aDone / aTotal : 0;
          bValue = bTotal > 0 ? bDone / bTotal : 0;
        } else if (sortConfig.key === "totalIssueCount") {
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

  const totalColumnCount = 6 + columns.length;

  return (
    <div className="space-y-3">
      <style>{`
        @media print {
          @page { size: A3 landscape; margin: 8mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body, #root, body > div, main { background: #ffffff !important; background-color: #ffffff !important; }
          html, body, #root, table { overflow: visible !important; max-width: 100% !important; width: 100% !important; }
          th, td { min-width: 0 !important; width: auto !important; white-space: normal !important; word-break: break-word !important; }
          .progress-bar-fill { width: var(--progress-width) !important; min-width: var(--progress-width) !important; max-width: var(--progress-width) !important; }
        }
      `}</style>

      <div className="flex items-center justify-between px-1 print:hidden">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search projects, leads, or custom fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            disabled={loading || processedProjects.length === 0}
            className="gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadProjectsCSV(processedProjects, columns)}
            disabled={loading || processedProjects.length === 0}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

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
                  Tasks {renderSortIcon("totalIssueCount")}
                </button>
              </TableHead>
              <TableHead className="min-w-[170px]">
                <button
                  className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort("progress")}
                >
                  Task Progress {renderSortIcon("progress")}
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
                    <div className="flex items-center gap-1 opacity-0 group-hover/head:opacity-100 transition-all">
                      <button
                        onClick={() => handleCopyJql(col)}
                        className="text-slate-400 hover:text-blue-700 p-1 rounded hover:bg-blue-100"
                        title={`Copy JQL field (project.${getJqlAlias(col.slotKey || col.id)})`}
                      >
                        {copiedId === col.id ? (
                          <Check className="w-3.5 h-3.5 text-blue-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
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
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                  {Array.from({ length: totalColumnCount }).map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : processedProjects.length > 0 ? (
              processedProjects.map((project) => (
                <TableRow
                  key={project.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-semibold text-slate-600">
                    <button
                      type="button"
                      onClick={() =>
                        router.open(`/jira/servicedesk/projects/${project.key}`)
                      }
                      className="bg-slate-100 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 border px-2 py-0.5 rounded transition-all cursor-pointer text-left"
                    >
                      {project.key}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                    {project.name}{" "}
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
                    <span className="bg-slate-100 border px-2 py-0.5 rounded font-medium whitespace-nowrap">
                      {project.insight?.totalIssueCount ?? 0}{" "}
                      {project.insight?.totalIssueCount === 1
                        ? "task"
                        : "tasks"}
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
                    <ProjectProgressBar project={project} />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.id} className="p-2">
                      <DynamicCell
                        project={project}
                        col={col}
                        onUpdatePropertyValue={onUpdatePropertyValue}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={totalColumnCount}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <SearchX className="w-6 h-6" />
                    </div>
                    {searchQuery.trim() ? (
                      <>
                        <p className="text-sm font-semibold text-slate-800">
                          No matching projects found
                        </p>
                        <p className="text-xs text-slate-500 max-w-xs">
                          No projects match "{searchQuery}". Try checking for
                          typos.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                          className="mt-2 h-8 text-xs gap-1.5"
                        >
                          Clear Search
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-800">
                          No projects available
                        </p>
                        <p className="text-xs text-slate-500">
                          There are no Jira projects found in this workspace.
                        </p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
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
    </div>
  );
}
