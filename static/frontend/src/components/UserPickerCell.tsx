import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import { User, X, Loader2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface UserValue {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
}

interface UserPickerCellProps {
  value: UserValue | null;
  disabled?: boolean;
  onChange: (value: UserValue | null) => void;
}

export function UserPickerCell({ value, disabled, onChange }: UserPickerCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserValue[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Jira users on query change when popover is open
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = (await invoke("searchJiraUsers", { query: search })) as unknown as UserValue[];
        setResults(users || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, isOpen]);

  if (disabled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-700 py-1">
        {value ? (
          <>
            {value.avatarUrl ? (
              <img src={value.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              <User className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{value.displayName}</span>
          </>
        ) : (
          <span className="text-slate-400 font-mono">—</span>
        )}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger Button */}
      <PopoverTrigger asChild>
        {value ? (
          <div className="flex items-center justify-between gap-1 border border-slate-200 rounded px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100 group cursor-pointer">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {value.avatarUrl ? (
                <img src={value.avatarUrl} alt="" className="w-4 h-4 rounded-full flex-shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}
              <span className="truncate font-medium text-slate-700">{value.displayName}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 print:hidden"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="w-full text-left text-xs text-slate-400 border border-transparent hover:border-slate-200 rounded px-2 py-1 font-mono transition-colors"
          >
            Select user...
          </button>
        )}
      </PopoverTrigger>

      {/* Shadcn Popover Content (Handles automatic flipping & viewport collision) */}
      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={16}
        className="w-60 p-1.5 space-y-1.5 bg-white border-slate-200 shadow-xl"
      >
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-slate-100">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search user..."
            className="w-full text-xs outline-none bg-transparent text-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center p-3 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            results.map((u) => (
              <button
                key={u.accountId}
                type="button"
                onClick={() => {
                  onChange(u);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-slate-100 transition-colors text-left"
              >
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="truncate text-slate-700">{u.displayName}</span>
              </button>
            ))
          ) : (
            <div className="text-[11px] text-slate-400 text-center py-2">No users found</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}