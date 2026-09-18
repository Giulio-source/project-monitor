import { Project, ColumnDef } from "../hooks/useProjects";

export const escapeCsvValue = (val: any): string => {
  if (val === null || val === undefined) return '""';
  if (typeof val === "boolean") return val ? '"Yes"' : '"No"';
  if (typeof val === "object" && val?.displayName)
    return `"${val.displayName.replace(/"/g, '""')}"`;
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
};

export const downloadProjectsCSV = (projects: Project[], columns: ColumnDef[]) => {
  const headers = [
    "Key",
    "Project Name",
    "Type",
    "Lead",
    "Total Tasks",
    "Completed Tasks",
    "Progress (%)",
    ...columns.map((col) => col.label),
  ];

  const rows = projects.map((project) => {
    const total = project.insight?.totalIssueCount ?? 0;
    const completed = project.insight?.completedIssueCount ?? 0;
    const percentage = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;

    const customValues = columns.map((col) => escapeCsvValue(project.properties?.[col.id]));

    return [
      escapeCsvValue(project.key),
      escapeCsvValue(project.name),
      escapeCsvValue(project.projectTypeKey?.replace("_", " ")),
      escapeCsvValue(project.lead?.displayName || "Unassigned"),
      escapeCsvValue(total),
      escapeCsvValue(completed),
      escapeCsvValue(`${percentage}%`),
      ...customValues,
    ].join(",");
  });

  const csvContent = [headers.map(escapeCsvValue).join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `project_monitor_${new Date().toISOString().split("T")[0]}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};