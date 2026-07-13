"use client";

import { LayoutGrid, Table2, CalendarDays } from "lucide-react";

type ViewKey = "board" | "table" | "calendar";

const VIEWS: { key: ViewKey; label: string; href: string; icon: typeof Table2 }[] = [
  { key: "board", label: "Board", href: "/board", icon: LayoutGrid },
  { key: "table", label: "Table", href: "/leads", icon: Table2 },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
];

/** Board / Table / Calendar view switch, matching the reference CRM's toggle. */
export function ViewToggle({ active }: { active: ViewKey }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
      {VIEWS.map((v) => {
        const Icon = v.icon;
        const on = v.key === active;
        return (
          <a
            key={v.key}
            href={v.href}
            className={
              "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-sm transition-colors " +
              (on ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")
            }
          >
            <Icon className="size-3.5" />
            {v.label}
          </a>
        );
      })}
    </div>
  );
}
