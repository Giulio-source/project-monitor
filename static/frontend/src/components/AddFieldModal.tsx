import React, { useState } from "react";
import { ColumnType } from "../hooks/useProjects";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface AddFieldModalProps {
  onAddColumn: (label: string, type: ColumnType) => Promise<boolean>;
}

export function AddFieldModal({ onAddColumn }: AddFieldModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<ColumnType>("text");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) return;

    setIsSubmitting(true);
    const success = await onAddColumn(fieldLabel.trim(), fieldType);
    setIsSubmitting(false);

    if (success) {
      setFieldLabel("");
      setFieldType("text");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add Field</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Create a new custom property column for all workspace projects.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="fieldName"
                className="text-xs font-semibold text-slate-700"
              >
                Field Name
              </label>
              <Input
                id="fieldName"
                placeholder="e.g. Target Release Date"
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="fieldType"
                className="text-xs font-semibold text-slate-700"
              >
                Field Type
              </label>
              <select
                id="fieldType"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as ColumnType)}
                className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="text">Text (Single Line)</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Checkbox / Flag</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!fieldLabel.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Add Field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
