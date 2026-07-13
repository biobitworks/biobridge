import type { DrilldownScope } from "@/components/ui/drilldown-dialog";
import type { DataColumn, DataField, DataValue } from "@/components/ui/data-types";
import {
  leadOrgTypeOptions,
  leadProtocolMatchOptions,
  leadRegulatoryStatusOptions,
  leadStageOptions,
} from "@/lib/leads/metadata";
import type {
  Lead,
  LeadDrilldownScope,
  LeadOption,
} from "@/lib/leads/types";

function optionConfig(options: readonly LeadOption[]) {
  return options.map((option) => ({
    id: option.value,
    label: option.label,
    color: option.color,
  }));
}

export const leadColumns = [
  {
    key: "orgName",
    label: "Organization",
    type: "text",
    sortable: true,
    width: 240,
    editable: true,
  },
  {
    key: "orgType",
    label: "Type",
    type: "select",
    sortable: true,
    width: 148,
    editable: true,
    config: { options: optionConfig(leadOrgTypeOptions) },
  },
  {
    key: "country",
    label: "Country",
    type: "text",
    sortable: true,
    width: 120,
    editable: true,
  },
  {
    key: "protocolMatch",
    label: "Protocol match",
    type: "select",
    sortable: true,
    width: 148,
    editable: true,
    config: { options: optionConfig(leadProtocolMatchOptions) },
  },
  {
    key: "regulatoryStatus",
    label: "Regulatory fit",
    type: "select",
    sortable: true,
    width: 148,
    editable: true,
    config: { options: optionConfig(leadRegulatoryStatusOptions) },
  },
  {
    key: "fitScore",
    label: "Fit score",
    type: "number",
    sortable: true,
    width: 108,
    editable: true,
  },
  {
    key: "stage",
    label: "Stage",
    type: "select",
    sortable: true,
    width: 160,
    editable: true,
    config: { options: optionConfig(leadStageOptions) },
  },
  {
    key: "contactEmail",
    label: "Contact email",
    type: "email",
    width: 200,
    editable: true,
  },
  {
    key: "website",
    label: "Website",
    type: "url",
    width: 180,
    editable: true,
  },
  {
    key: "sourceUrl",
    label: "Source",
    type: "url",
    width: 160,
    editable: true,
  },
  {
    key: "city",
    label: "City",
    type: "text",
    sortable: true,
    width: 120,
    editable: true,
  },
  {
    key: "capabilities",
    label: "Capabilities",
    type: "text",
    width: 220,
    editable: true,
  },
  {
    key: "regulatoryNotes",
    label: "Regulatory notes",
    type: "text",
    width: 220,
    editable: true,
  },
  {
    key: "contactName",
    label: "Contact name",
    type: "text",
    width: 160,
    editable: true,
  },
  {
    key: "contactTitle",
    label: "Contact title",
    type: "text",
    width: 160,
    editable: true,
  },
  {
    key: "outreachDraft",
    label: "Outreach draft",
    type: "text",
    width: 220,
    editable: true,
  },
  {
    key: "researchSummary",
    label: "Research summary",
    type: "text",
    width: 220,
    editable: true,
  },
] satisfies DataColumn<Lead>[];

export const leadDetailFields = leadColumns satisfies DataField[];

export function leadValues(lead: Lead): Record<string, DataValue> {
  return {
    orgName: lead.orgName,
    orgType: lead.orgType,
    country: lead.country,
    city: lead.city,
    website: lead.website,
    capabilities: lead.capabilities,
    protocolMatch: lead.protocolMatch,
    regulatoryStatus: lead.regulatoryStatus,
    regulatoryNotes: lead.regulatoryNotes,
    fitScore: lead.fitScore,
    stage: lead.stage,
    contactName: lead.contactName,
    contactTitle: lead.contactTitle,
    contactEmail: lead.contactEmail,
    outreachDraft: lead.outreachDraft,
    researchSummary: lead.researchSummary,
    sourceUrl: lead.sourceUrl,
  };
}

export function leadRowsScope(
  scope: LeadDrilldownScope | null,
): DrilldownScope<Lead> | null {
  if (!scope) return null;
  return {
    id: scope.id,
    label: scope.label,
    description: scope.description,
    rows: scope.leads,
  };
}
