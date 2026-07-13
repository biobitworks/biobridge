import type {
  LeadOption,
  LeadOrgType,
  LeadProtocolMatch,
  LeadRegulatoryStatus,
  LeadStage,
} from "@/lib/leads/types";

export const leadStageOptions = [
  { value: "discovered", label: "Discovered", color: "gray" },
  { value: "researched", label: "Researched", color: "cyan" },
  { value: "qualified", label: "Qualified", color: "blue" },
  { value: "drafted", label: "Outreach drafted", color: "indigo" },
  { value: "sent", label: "Sent", color: "green" },
  { value: "replied", label: "Replied", color: "pink" },
  { value: "disqualified", label: "Disqualified", color: "rose" },
] satisfies LeadOption<LeadStage>[];

export const leadOrgTypeOptions = [
  { value: "cro", label: "CRO", color: "blue" },
  { value: "academic", label: "Academic lab", color: "green" },
  { value: "biotech", label: "Biotech", color: "purple" },
  { value: "core_facility", label: "Core facility", color: "teal" },
  { value: "institute", label: "Research institute", color: "indigo" },
] satisfies LeadOption<LeadOrgType>[];

export const leadProtocolMatchOptions = [
  { value: "strong", label: "Strong", color: "green" },
  { value: "partial", label: "Partial", color: "yellow" },
  { value: "weak", label: "Weak", color: "rose" },
] satisfies LeadOption<LeadProtocolMatch>[];

export const leadRegulatoryStatusOptions = [
  { value: "permitted", label: "Permitted", color: "green" },
  { value: "restricted", label: "Restricted", color: "yellow" },
  { value: "prohibited", label: "Prohibited", color: "rose" },
  { value: "unknown", label: "Unknown", color: "gray" },
] satisfies LeadOption<LeadRegulatoryStatus>[];

export function leadOptionLabel(options: readonly LeadOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}
