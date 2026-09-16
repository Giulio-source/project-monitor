import { Search, XCircle } from "lucide-react";
import React, { useState } from "react";
import { AddFieldModal } from "./components/AddFieldModal";
import { ProjectTable } from "./components/ProjectTable";
import { StorageDebugModal } from "./components/StorageDebugModal";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Toaster } from "./components/ui/sonner";
import { useProjects } from "./hooks/useProjects";

export default function App() {
  const {
    projects,
    columns,
    loading,
    error,
    addColumn,
    deleteColumn,
    updatePropertyValue,
    refetch,
    permissions,
  } = useProjects();

  const [fieldLabel, setFieldLabel] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) return;

    setIsSubmitting(true);
    const success = await addColumn(fieldLabel.trim(), "text");
    setIsSubmitting(false);

    if (success) {
      setFieldLabel("");
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 space-y-6">
      <Toaster position="bottom-right" />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Project Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview and centralized field management across all workspace
            projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StorageDebugModal />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log(
                "%c Projects",
                "background: dodgerblue; color: white; padding: 6px 8px 4px 2px; border-radius: 999px",
                projects,
              );
            }}
            disabled={loading}
          >
            Debug Projects
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            Refresh
          </Button>
          {permissions.canManageColumns && (
            <AddFieldModal onAddColumn={addColumn} />
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search projects or custom fields..."
            className="pl-9 pr-8 h-9 text-xs bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Workspace Projects: {projects.length}
        </div>
      </div>

      {/* Extracted Project Table Component */}
      <ProjectTable
        projects={projects}
        columns={columns}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        onUpdatePropertyValue={updatePropertyValue}
        onDeleteColumn={deleteColumn}
        canManageColumns={permissions.canManageColumns}
      />
    </div>
  );
}
