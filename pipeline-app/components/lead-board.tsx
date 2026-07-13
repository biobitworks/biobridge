"use client";

import { Lock } from "lucide-react";
import { useMemo } from "react";
import { leadStageOptions } from "@/lib/leads/metadata";
import type { Lead } from "@/lib/leads/types";

/**
 * Kanban board of leads grouped by stage — the CRM-style pipeline view.
 * Cards flow left→right across stage columns. Each card shows org name + fit
 * score, and a lock icon when private contact fields are vaulted (masked).
 */
export function LeadBoard({ leads }: { leads: Lead[] }) {
  const columns = useMemo(() => {
    const byStage = new Map<string, Lead[]>();
    for (const opt of leadStageOptions) byStage.set(opt.value, []);
    const other: Lead[] = [];
    for (const lead of leads) {
      const key = (lead.stage ?? "").toString();
      if (byStage.has(key)) byStage.get(key)!.push(lead);
      else other.push(lead);
    }
    const cols: { value: string; label: string; leads: Lead[] }[] = leadStageOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
      leads: byStage.get(opt.value) ?? [],
    }));
    if (other.length) cols.push({ value: "_other", label: "Unstaged", leads: other });
    return cols;
  }, [leads]);

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-4 lg:px-6">
      {columns.map((col) => (
        <div key={col.value} className="flex w-72 shrink-0 flex-col gap-2">
          <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
            <span className="text-sm font-medium">{col.label}</span>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {col.leads.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {col.leads.map((lead) => {
              const vaulted =
                lead.contactEmail == null ||
                /sealed/i.test(String(lead.contactEmail)) ||
                lead.contactEmail === "";
              return (
                <div
                  key={lead.id}
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">{lead.orgName}</span>
                    {vaulted ? (
                      <span title="Private contact fields are vaulted">
                        <Lock className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{lead.country ?? "—"}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 tabular-nums">
                      fit {Number.isFinite(lead.fitScore) ? lead.fitScore : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
            {col.leads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No leads
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
