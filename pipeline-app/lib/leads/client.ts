"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { appRecordThreadHref, type KylonWorkspaceContext } from "@/lib/kylon/bridge";
import { queryKeys } from "@/lib/query-keys";
import type {
  AppRecordListResponse,
  AppRecordResponse,
  CanonicalFieldValue,
} from "@/lib/app-definition/types";
import type {
  Lead,
  LeadListPage,
} from "@/lib/leads/types";

export const leadApiPath = "/api/leads";
export const DEFAULT_LEAD_PAGE_SIZE = 100;

const leadThreadEntityId = "leads";
const apiFieldByUiField: Record<string, string> = {
  orgName: "org_name",
  orgType: "org_type",
  protocolMatch: "protocol_match",
  regulatoryStatus: "regulatory_status",
  regulatoryNotes: "regulatory_notes",
  fitScore: "fit_score",
  contactName: "contact_name",
  contactTitle: "contact_title",
  contactEmail: "contact_email",
  outreachDraft: "outreach_draft",
  researchSummary: "research_summary",
  sourceUrl: "source_url",
};

type UpdateLeadFieldInput = {
  leadId: string;
  fieldKey: string;
  value: CanonicalFieldValue;
};

type DeleteLeadInput = {
  leadId: string;
};

type LeadListQueryData = LeadListPage | InfiniteData<LeadListPage>;

export interface LeadListFilters {
  stage?: string;
}

function textValue(value: CanonicalFieldValue | undefined): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function numberValue(value: CanonicalFieldValue | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function leadWithFieldValue(
  lead: Lead,
  fieldKey: string,
  value: CanonicalFieldValue,
): Lead {
  switch (fieldKey) {
    case "orgName":
      return { ...lead, orgName: textValue(value) ?? "" };
    case "orgType":
      return { ...lead, orgType: textValue(value) };
    case "country":
      return { ...lead, country: textValue(value) };
    case "city":
      return { ...lead, city: textValue(value) };
    case "website":
      return { ...lead, website: textValue(value) };
    case "capabilities":
      return { ...lead, capabilities: textValue(value) };
    case "protocolMatch":
      return { ...lead, protocolMatch: textValue(value) };
    case "regulatoryStatus":
      return { ...lead, regulatoryStatus: textValue(value) };
    case "regulatoryNotes":
      return { ...lead, regulatoryNotes: textValue(value) };
    case "fitScore":
      return { ...lead, fitScore: numberValue(value) };
    case "stage":
      return { ...lead, stage: textValue(value) };
    case "contactName":
      return { ...lead, contactName: textValue(value) };
    case "contactTitle":
      return { ...lead, contactTitle: textValue(value) };
    case "contactEmail":
      return { ...lead, contactEmail: textValue(value) };
    case "outreachDraft":
      return { ...lead, outreachDraft: textValue(value) };
    case "researchSummary":
      return { ...lead, researchSummary: textValue(value) };
    case "sourceUrl":
      return { ...lead, sourceUrl: textValue(value) };
    default:
      if (fieldKey in lead) {
        return { ...lead, [fieldKey]: value } as Lead;
      }
      return lead;
  }
}

function optimisticLead(
  lead: Lead,
  variables: UpdateLeadFieldInput,
): Lead {
  return {
    ...leadWithFieldValue(lead, variables.fieldKey, variables.value),
    updatedAt: new Date().toISOString(),
  };
}

function updateLeadPage(
  page: LeadListPage,
  variables: UpdateLeadFieldInput,
): LeadListPage {
  let changed = false;
  const leads = page.leads.map((lead) => {
    if (lead.id !== variables.leadId) return lead;
    changed = true;
    return optimisticLead(lead, variables);
  });

  return changed ? { ...page, leads } : page;
}

function isInfiniteLeadListData(
  data: LeadListQueryData,
): data is InfiniteData<LeadListPage> {
  return Array.isArray((data as InfiniteData<LeadListPage>).pages);
}

function updateLeadListQueryData(
  data: LeadListQueryData | undefined,
  variables: UpdateLeadFieldInput,
): LeadListQueryData | undefined {
  if (!data) return data;
  if (isInfiniteLeadListData(data)) {
    return {
      ...data,
      pages: data.pages.map((page) => updateLeadPage(page, variables)),
    };
  }
  return updateLeadPage(data, variables);
}

function removeLeadFromPage(page: LeadListPage, leadId: string): LeadListPage {
  const leads = page.leads.filter((lead) => lead.id !== leadId);
  return leads.length === page.leads.length ? page : { ...page, leads };
}

function removeLeadFromListQueryData(
  data: LeadListQueryData | undefined,
  leadId: string,
): LeadListQueryData | undefined {
  if (!data) return data;
  if (isInfiniteLeadListData(data)) {
    return {
      ...data,
      pages: data.pages.map((page) => removeLeadFromPage(page, leadId)),
    };
  }
  return removeLeadFromPage(data, leadId);
}

export function leadFromResponse(response: AppRecordResponse): Lead {
  return {
    id: response.record_id,
    orgName: textValue(response.data.org_name) ?? response.record_id,
    orgType: textValue(response.data.org_type),
    country: textValue(response.data.country),
    city: textValue(response.data.city),
    website: textValue(response.data.website),
    capabilities: textValue(response.data.capabilities),
    protocolMatch: textValue(response.data.protocol_match),
    regulatoryStatus: textValue(response.data.regulatory_status),
    regulatoryNotes: textValue(response.data.regulatory_notes),
    fitScore: numberValue(response.data.fit_score),
    stage: textValue(response.data.stage),
    contactName: textValue(response.data.contact_name),
    contactTitle: textValue(response.data.contact_title),
    contactEmail: textValue(response.data.contact_email),
    outreachDraft: textValue(response.data.outreach_draft),
    researchSummary: textValue(response.data.research_summary),
    sourceUrl: textValue(response.data.source_url),
    createdAt: response.created_at,
    updatedAt: response.updated_at,
  };
}

function leadListFromResponse(response: AppRecordListResponse): LeadListPage {
  return {
    leads: response.records.map(leadFromResponse),
    pagination: {
      limit: response.pagination.limit,
      nextCursor: response.pagination.next_cursor,
      hasMore: response.pagination.has_more,
    },
  };
}

async function fetchLeadList({
  pageSize,
  cursor,
  filters = {},
}: {
  pageSize: number;
  cursor?: string;
  filters?: LeadListFilters;
}): Promise<LeadListPage> {
  const url = new URL(leadApiPath, window.location.origin);
  url.searchParams.set("limit", String(pageSize));
  if (cursor) url.searchParams.set("cursor", cursor);
  if (filters.stage) url.searchParams.set("stage", filters.stage);

  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to load leads: ${response.status}`);
  }

  return leadListFromResponse((await response.json()) as AppRecordListResponse);
}

export function useLeads(
  pageSize = DEFAULT_LEAD_PAGE_SIZE,
  filters: LeadListFilters = {},
) {
  const query = useQuery({
    queryKey: queryKeys.leads.list({ limit: pageSize, stage: filters.stage }),
    queryFn: () => fetchLeadList({ pageSize, filters }),
  });

  return {
    ...query,
    leads: query.data?.leads ?? [],
  };
}

export function useInfiniteLeads(
  pageSize = DEFAULT_LEAD_PAGE_SIZE,
  filters: LeadListFilters = {},
) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.leads.infiniteList({ limit: pageSize, stage: filters.stage }),
    queryFn: ({ pageParam }) =>
      fetchLeadList({
        pageSize,
        cursor: pageParam,
        filters,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? undefined,
  });

  return {
    ...query,
    leads: query.data?.pages.flatMap((page) => page.leads) ?? [],
  };
}

async function patchLeadField({
  leadId,
  fieldKey,
  value,
}: UpdateLeadFieldInput): Promise<Lead> {
  const apiField = apiFieldByUiField[fieldKey] ?? fieldKey;
  const response = await fetch(`${leadApiPath}/${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ data: { [apiField]: value } }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update lead: ${response.status}`);
  }
  return leadFromResponse((await response.json()) as AppRecordResponse);
}

export function useUpdateLeadField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchLeadField,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.lists() });
      const previousLists = queryClient.getQueriesData<LeadListQueryData>({
        queryKey: queryKeys.leads.lists(),
      });

      queryClient.setQueriesData<LeadListQueryData>(
        { queryKey: queryKeys.leads.lists() },
        (data) => updateLeadListQueryData(data, variables),
      );

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
    },
  });
}

async function deleteLeadRequest({ leadId }: DeleteLeadInput): Promise<void> {
  const response = await fetch(`${leadApiPath}/${encodeURIComponent(leadId)}`, {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to delete lead: ${response.status}`);
  }
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeadRequest,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.lists() });
      const previousLists = queryClient.getQueriesData<LeadListQueryData>({
        queryKey: queryKeys.leads.lists(),
      });

      queryClient.setQueriesData<LeadListQueryData>(
        { queryKey: queryKeys.leads.lists() },
        (data) => removeLeadFromListQueryData(data, variables.leadId),
      );

      return { previousLists };
    },
    onError: (_error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
    },
  });
}

export function leadThreadHref(context: KylonWorkspaceContext, leadId: string) {
  return appRecordThreadHref(context, leadThreadEntityId, leadId);
}
