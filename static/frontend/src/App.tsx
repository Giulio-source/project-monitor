import { AddFieldModal } from "./components/AddFieldModal";
import { AuditLogModal } from "./components/AuditLogModal";
import { ClearPropertiesModal } from "./components/ClearPropertiesModal";
import { ProjectTable } from "./components/ProjectTable";
import { StorageDebugModal } from "./components/StorageDebugModal";
import { Button } from "./components/ui/button";
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
    clearAllProperties,
  } = useProjects();

  return (
    <main className="min-h-screen bg-slate-50/50 p-8 space-y-6">
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
        <div className="flex items-center gap-3 print:hidden">
          <AuditLogModal />
          <ClearPropertiesModal
            onClearAll={clearAllProperties}
            disabled={loading}
          />
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

      {/* Extracted Project Table Component */}
      <ProjectTable
        projects={projects}
        columns={columns}
        loading={loading}
        error={error}
        onUpdatePropertyValue={updatePropertyValue}
        onDeleteColumn={deleteColumn}
        canManageColumns={permissions.canManageColumns}
      />
    </main>
  );
}
