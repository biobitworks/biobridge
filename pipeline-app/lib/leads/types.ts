import type { CanonicalFieldValue, PaginationResult } from "@/lib/app-definition/types";

export type LeadStage = "discovered" | "researched" | "qualified" | "drafted" | "sent" | "replied" | "disqualified";
export type LeadOrgType = "cro" | "academic" | "biotech" | "core_facility" | "institute";
export type LeadProtocolMatch = "strong" | "partial" | "weak";
export type LeadRegulatoryStatus = "permitted" | "restricted" | "prohibited" | "unknown";

export interface LeadData extends Record<string, CanonicalFieldValue> {
  org_name: string;
  org_type: LeadOrgType | string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  capabilities: string | null;
  protocol_match: LeadProtocolMatch | string | null;
  regulatory_status: LeadRegulatoryStatus | string | null;
  regulatory_notes: string | null;
  fit_score: number;
  stage: LeadStage | string | null;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  outreach_draft: string | null;
  research_summary: string | null;
  source_url: string | null;
}

export interface LeadRecord {
  id: string;
  data: LeadData;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lead {
  id: string;
  orgName: string;
  orgType: LeadOrgType | string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  capabilities: string | null;
  protocolMatch: LeadProtocolMatch | string | null;
  regulatoryStatus: LeadRegulatoryStatus | string | null;
  regulatoryNotes: string | null;
  fitScore: number;
  stage: LeadStage | string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  outreachDraft: string | null;
  researchSummary: string | null;
  sourceUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadListResult {
  leads: LeadRecord[];
  pagination: PaginationResult;
}

export interface LeadListPage {
  leads: Lead[];
  pagination: {
    limit: number;
    nextCursor?: string;
    hasMore: boolean;
  };
}

export interface LeadDrilldownScope {
  id: string;
  label: string;
  description: string;
  leads: Lead[];
  lead?: Lead;
  leadOnly?: boolean;
}

export interface LeadOption<TValue extends string = string> {
  value: TValue;
  label: string;
  color?: string;
}
