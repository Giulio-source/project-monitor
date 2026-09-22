import React, { useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { History, RefreshCw, Trash2 } from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { useUsers } from "../hooks/useUsers";

export function AuditLogModal() {
  const { projects, columns } = useProjects();
  const { fetchUsers, getUserName } = useUsers();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleClearLogs = async () => {
    if (
      !window.confirm("Are you sure you want to delete all audit log history?")
    ) {
      return;
    }

    setLoading(true);
    try {
      await invoke("clearAuditLogs");
      setLogs([]); // Instantly clear UI table
    } catch (err) {
      console.error("Error clearing logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data: any = await invoke<any[]>("getAuditLogs");
      setLogs(data || []);
    } catch (e) {
      console.error("Failed to fetch audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Only triggers when modal transitions from closed to open
    if (open) {
      fetchLogs();
    }
  };

  useEffect(() => {
    if (logs.length > 0) {
      const userIds = logs.map((l) => l.accountId);
      fetchUsers(userIds);
    }
  }, [logs, fetchUsers, columns]);

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <History className="w-3.5 h-3.5" />
          Audit Log
        </Button>
      </DialogTrigger>

      {/* Fullscreen Overlay Styling */}
      <DialogContent className="w-[94vw] h-[90vh] max-w-none max-h-none rounded-xl p-6 flex flex-col bg-white border shadow-lg">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b pb-4 pr-8">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-slate-700" />
            Activity Audit History
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* <Button
              variant="destructive"
              size="sm"
              onClick={handleClearLogs}
              disabled={loading || logs.length === 0}
              className="gap-1.5 text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </Button> */}

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto mt-4">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              Loading audit history...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500">
              No audit records found.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                <tr className="border-b text-slate-700">
                  <th className="p-3 font-semibold">Time</th>
                  <th className="p-3 font-semibold">User ID</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold font-sans">Project</th>
                  <th className="p-3 font-semibold font-sans">Field</th>
                  <th className="p-3 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-slate-50 font-mono text-[12px]"
                  >
                    <td className="p-3 text-slate-500 whitespace-nowrap font-sans">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-sans text-slate-600">
                      {getUserName(log.accountId)}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {log.action}
                    </td>
                    <td className="p-3 font-sans font-medium text-slate-700">
                      {projects.find((p) => p.id === log.projectId)?.key}
                    </td>
                    <td className="p-3 font-sans font-medium text-slate-700">
                      {columns.find((c) => c.id === log.slotKey)?.label}
                    </td>
                    <td className="p-3 font-sans">
                      {log.action === "VALUE_UPDATED" ? (
                        <span>
                          <span className="text-red-600 font-semibold mr-1">
                            {log.oldValue || "empty"}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-green-600 font-semibold ml-1">
                            {log.newValue}
                          </span>
                        </span>
                      ) : log.action === "COLUMN_DELETED" ? (
                        <span className="text-red-600 font-medium">
                          Deleted column "
                          {columns.find((c) => c.id === log.slotKey)?.label}"
                        </span>
                      ) : log.action === "COLUMN_CREATED" ? (
                        <span className="text-blue-600 font-medium">
                          Created column "
                          {columns.find((c) => c.id === log.slotKey)?.label}"
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
