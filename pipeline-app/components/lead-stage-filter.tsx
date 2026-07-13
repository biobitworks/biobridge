"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { leadStageOptions } from "@/lib/leads/metadata";
import type { LeadStage } from "@/lib/leads/types";

export type LeadStageFilterValue = "all" | LeadStage;

export function LeadStageFilter({
  value,
  onValueChange,
}: {
  value: LeadStageFilterValue;
  onValueChange: (value: LeadStageFilterValue) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(nextValue) => {
        if (!nextValue) return;
        onValueChange(nextValue as LeadStageFilterValue);
      }}
      aria-label="Filter leads by stage"
    >
      <ToggleGroupItem value="all" aria-label="Show all stages">
        All
      </ToggleGroupItem>
      {leadStageOptions.map((stage) => (
        <ToggleGroupItem
          key={stage.value}
          value={stage.value}
          aria-label={`Show ${stage.label} leads`}
        >
          {stage.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
