import React, { useState, useEffect } from "react";
import { router } from "@forge/bridge";
import { Link, ExternalLink, Check, X, Pencil } from "lucide-react";
import { Input } from "./ui/input";

interface UrlCellProps {
  value: string | null;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}

export function UrlCell({ value, disabled, onChange }: UrlCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const ensureProtocol = (url: string) => {
    if (!url.trim()) return "";
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  };

  const handleSave = () => {
    const formattedUrl = ensureProtocol(tempValue);
    onChange(formattedUrl || null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTempValue(value || "");
      setIsEditing(false);
    }
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (value && isValidUrl(value)) {
      // Use Forge router to bypass iframe sandbox restrictions
      router.open(value);
    }
  };

  // Editing Mode
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full max-w-sm">
        <Input
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://..."
          className="h-7 text-xs flex-1"
        />
        <button
          onClick={handleSave}
          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setTempValue(value || "");
            setIsEditing(false);
          }}
          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // View Mode
  return (
    <div className="group flex items-center gap-2 max-w-[200px] py-1">
      {value && isValidUrl(value) ? (
        <a
          href={value}
          onClick={handleOpenLink}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-blue-600 hover:text-blue-800 hover:underline text-xs cursor-pointer"
        >
          <Link className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{new URL(value).hostname}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ) : (
        <span className="text-slate-400 font-mono text-xs flex-1 min-w-0 truncate">
          {value || "—"}
        </span>
      )}

      {!disabled && (
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-all print:hidden flex-shrink-0"
          title="Edit link"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}