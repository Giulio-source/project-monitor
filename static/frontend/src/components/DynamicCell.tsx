import React from "react";
import { Project, ColumnDef } from "../hooks/useProjects";
import { Input } from "./ui/input";
import { UserPickerCell } from "./UserPickerCell";
import { UrlCell } from "./UrlCell";

interface DynamicCellProps {
  project: Project;
  col: ColumnDef;
  onUpdatePropertyValue: (projectId: string, key: string, value: any) => void;
}

export function DynamicCell({
  project,
  col,
  onUpdatePropertyValue,
}: DynamicCellProps) {
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

  if (col.type === "user") {
    return (
      <UserPickerCell
        value={value || null}
        disabled={!canEdit}
        onChange={(selectedUser) =>
          onUpdatePropertyValue(project.id, col.id, selectedUser)
        }
      />
    );
  }

  if (col.type === "url") {
    return (
      <UrlCell
        value={value}
        disabled={!canEdit}
        onChange={(val) => onUpdatePropertyValue(project.id, col.id, val)}
      />
    );
  }

  return (
    <Input
      type={
        col.type === "number" ? "number" : col.type === "date" ? "date" : "text"
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
}
