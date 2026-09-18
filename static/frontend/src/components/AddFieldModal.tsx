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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AddFieldModalProps {
  onAddColumn: (label: string, type: ColumnType) => Promise<boolean>;
}

const FIELD_TYPES: { value: ColumnType; label: string }[] = [
  { value: "text", label: "Text (Single Line)" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Checkbox / Flag" },
  { value: "user", label: "User Picker" },
  { value: "url", label: "URL / External Link" },
];

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
              <Select
                value={fieldType}
                onValueChange={(val) => setFieldType(val as ColumnType)}
              >
                <SelectTrigger id="fieldType" className="w-full">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
