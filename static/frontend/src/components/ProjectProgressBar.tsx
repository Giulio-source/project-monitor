import React from "react";
import { Project } from "../hooks/useProjects";

export function ProjectProgressBar({ project }: { project: Project }) {
  const total = project.insight?.totalIssueCount ?? 0;
  const completed = project.insight?.completedIssueCount ?? 0;
  const percentage =
    total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;

  return (
    <div className="w-[140px] space-y-1 py-0.5 print:w-full">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
        <span>
          {completed}/{total} tasks
        </span>
        <span className="font-semibold text-slate-800">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <div
          className={`h-full transition-all duration-300 progress-bar-fill ${
            percentage === 100
              ? "bg-emerald-500"
              : percentage > 50
                ? "bg-blue-600"
                : percentage > 0
                  ? "bg-amber-500"
                  : "bg-slate-300"
          }`}
          style={
            {
              width: `${percentage}%`,
              "--progress-width": `${percentage}%`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
