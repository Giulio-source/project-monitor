import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import { useProjects } from "../hooks/useProjects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Plus, Loader2 } from "lucide-react";

interface IssueType {
  id: string;
  name: string;
  iconUrl?: string;
}

interface CreateTaskModalProps {
  onTaskCreated?: (task: any) => void;
}

export function CreateTaskModal({ onTaskCreated }: CreateTaskModalProps) {
  const { projects, loading: loadingProjects } = useProjects();
  const [open, setOpen] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState<string>("");
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editableProjects = (projects || []).filter((p) => p.canEdit);

  // Fetch issue types whenever the selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setIssueTypes([]);
      setSelectedIssueTypeId("");
      return;
    }

    let isMounted = true;
    setLoadingIssueTypes(true);

    invoke<IssueType[]>("getProjectIssueTypes", {
      projectId: selectedProjectId,
    })
      .then((res) => {
        if (!isMounted) return;

        const types = (res as unknown as IssueType[]) || [];
        setIssueTypes(types);

        const defaultType =
          types.find((t) => t.name.toLowerCase() === "task") || types[0];

        setSelectedIssueTypeId(defaultType ? defaultType.id : "");
      })
      .catch((err) => {
        console.error("Failed to load issue types:", err);
        if (isMounted) setIssueTypes([]);
      })
      .finally(() => {
        if (isMounted) setLoadingIssueTypes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedProjectId("");
      setIssueTypes([]);
      setSelectedIssueTypeId("");
      setSummary("");
      setDescription("");
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedIssueTypeId || !summary.trim()) {
      setError("Please select a project, issue type, and enter a title.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const createdTask = await invoke("createProjectTask", {
        projectId: selectedProjectId,
        issueTypeId: selectedIssueTypeId,
        summary: summary.trim(),
        description: description.trim(),
      });

      if (onTaskCreated) {
        onTaskCreated(createdTask);
      }

      setOpen(false);
    } catch (err: any) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 h-9" variant="secondary">
          <Plus className="w-3.5 h-3.5" />
          Create Task
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-800">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-md text-xs">
              {error}
            </div>
          )}

          {/* Project Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="project"
              className="text-xs font-medium text-slate-700"
            >
              Target Project
            </Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={loadingProjects || loading}
            >
              <SelectTrigger id="project" className="h-9 text-xs">
                <SelectValue placeholder="Select a project you manage" />
              </SelectTrigger>
              <SelectContent>
                {editableProjects.length === 0 ? (
                  <div className="p-2 text-xs text-slate-400 text-center">
                    No manageable projects available
                  </div>
                ) : (
                  editableProjects.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                      className="text-xs"
                    >
                      {project.name} ({project.key})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Issue Type Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="issueType"
              className="text-xs font-medium text-slate-700"
            >
              Issue Type
            </Label>
            <Select
              value={selectedIssueTypeId}
              onValueChange={setSelectedIssueTypeId}
              disabled={!selectedProjectId || loadingIssueTypes || loading}
            >
              <SelectTrigger id="issueType" className="h-9 text-xs">
                <SelectValue
                  placeholder={
                    !selectedProjectId
                      ? "Select a project first"
                      : loadingIssueTypes
                        ? "Loading issue types..."
                        : "Select issue type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      {type.iconUrl && (
                        <img
                          src={type.iconUrl}
                          alt=""
                          className="w-3.5 h-3.5"
                        />
                      )}
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Summary */}
          <div className="space-y-1.5">
            <Label
              htmlFor="summary"
              className="text-xs font-medium text-slate-700"
            >
              Task Title / Summary
            </Label>
            <Input
              id="summary"
              placeholder="e.g. Update Q4 project milestones"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          {/* Task Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-medium text-slate-700"
            >
              Description{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Add task details or scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                loading ||
                !selectedProjectId ||
                !selectedIssueTypeId ||
                !summary.trim()
              }
              className="h-8 text-xs gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
