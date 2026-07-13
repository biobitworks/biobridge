import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import {
  decodeCursor,
  defaultPageLimit,
  encodeCursor,
} from "@/lib/api/pagination";
import {
  executeQuery,
  hasDatabaseConnection,
  queryRows,
  quoteIdentifier,
  type DbParam,
  type DbRow,
} from "@/lib/db";
import type {
  AppRecordListResponse,
  AppRecordResponse,
  CanonicalFieldValue,
  PaginationParams,
} from "@/lib/app-definition/types";
import type {
  LeadData,
  LeadListResult,
  LeadRecord,
} from "@/lib/leads/types";

export const leadEntityId = "leads";

const leadTable = "leads";
const leadSelectColumns = [
  "id",
  "created_at",
  "updated_at",
  "org_name",
  "org_type",
  "country",
  "city",
  "website",
  "capabilities",
  "protocol_match",
  "regulatory_status",
  "regulatory_notes",
  "fit_score",
  "stage",
  "contact_name",
  "contact_title",
  "contact_email",
  "outreach_draft",
  "research_summary",
  "source_url",
] as const;

const editableLeadColumns = new Set<keyof LeadData>([
  "org_name",
  "org_type",
  "country",
  "city",
  "website",
  "capabilities",
  "protocol_match",
  "regulatory_status",
  "regulatory_notes",
  "fit_score",
  "stage",
  "contact_name",
  "contact_title",
  "contact_email",
  "outreach_draft",
  "research_summary",
  "source_url",
]);

type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "is_empty"
  | "is_not_empty"
  | "lt"
  | "lte"
  | "gt"
  | "gte";

export interface LeadListFilter {
  field_id: string;
  operator: FilterOperator;
  value?: unknown;
}

export interface LeadListSort {
  field_id: string;
  direction: "asc" | "desc";
}

export interface LeadListControls {
  filters: LeadListFilter[];
  sorts: LeadListSort[];
}

const filterOperators = new Set<FilterOperator>([
  "eq",
  "neq",
  "contains",
  "is_empty",
  "is_not_empty",
  "lt",
  "lte",
  "gt",
  "gte",
]);
const allowedListFields = new Set<string>(leadSelectColumns);

interface LeadDbRow extends DbRow {
  id: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  org_name?: unknown;
  org_type?: unknown;
  country?: unknown;
  city?: unknown;
  website?: unknown;
  capabilities?: unknown;
  protocol_match?: unknown;
  regulatory_status?: unknown;
  regulatory_notes?: unknown;
  fit_score?: unknown;
  stage?: unknown;
  contact_name?: unknown;
  contact_title?: unknown;
  contact_email?: unknown;
  outreach_draft?: unknown;
  research_summary?: unknown;
  source_url?: unknown;
}

function textValue(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function canonicalDateString(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function canonicalNumberValue(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Expected a finite number.");
  }
  return parsed;
}

function canonicalTextValue(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function rowToLead(row: LeadDbRow): LeadRecord {
  return {
    id: String(row.id),
    createdAt: dateValue(row.created_at) ?? undefined,
    updatedAt: dateValue(row.updated_at) ?? undefined,
    data: {
      org_name: textValue(row.org_name) ?? String(row.id),
      org_type: textValue(row.org_type),
      country: textValue(row.country),
      city: textValue(row.city),
      website: textValue(row.website),
      capabilities: textValue(row.capabilities),
      protocol_match: textValue(row.protocol_match),
      regulatory_status: textValue(row.regulatory_status),
      regulatory_notes: textValue(row.regulatory_notes),
      fit_score: numberValue(row.fit_score),
      stage: textValue(row.stage),
      contact_name: textValue(row.contact_name),
      contact_title: textValue(row.contact_title),
      contact_email: textValue(row.contact_email),
      outreach_draft: textValue(row.outreach_draft),
      research_summary: textValue(row.research_summary),
      source_url: textValue(row.source_url),
    },
  };
}

function normalizeLeadUpdate(input: Record<string, unknown>): Partial<LeadData> {
  const out: Partial<LeadData> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!editableLeadColumns.has(key as keyof LeadData)) continue;
    switch (key as keyof LeadData) {
      case "fit_score":
        out.fit_score = canonicalNumberValue(value);
        break;
      case "org_name":
      case "org_type":
      case "country":
      case "city":
      case "website":
      case "capabilities":
      case "protocol_match":
      case "regulatory_status":
      case "regulatory_notes":
      case "stage":
      case "contact_name":
      case "contact_title":
      case "contact_email":
      case "outreach_draft":
      case "research_summary":
      case "source_url":
        out[key] = canonicalTextValue(value);
        break;
    }
  }
  return out;
}

function dbValue(value: unknown): DbParam {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) return value;
  return JSON.stringify(value);
}

function selectSql() {
  return leadSelectColumns
    .map((column) => `${quoteIdentifier(column)} as ${quoteIdentifier(column)}`)
    .join(", ");
}

function pagedResult(
  leads: LeadRecord[],
  pagination: PaginationParams,
  offset: number,
): LeadListResult {
  const page = leads.slice(offset, offset + pagination.limit);
  const hasMore = offset + pagination.limit < leads.length;
  return {
    leads: page,
    pagination: {
      limit: pagination.limit,
      ...(hasMore ? { nextCursor: encodeCursor(offset + pagination.limit) } : {}),
      hasMore,
    },
  };
}

function filterAndSortLeads(leads: LeadRecord[], controls: LeadListControls): LeadRecord[] {
  let result = [...leads];

  for (const filter of controls.filters) {
    if (!allowedListFields.has(filter.field_id)) continue;
    result = result.filter((lead) => {
      const raw = (lead.data as Record<string, unknown>)[filter.field_id];
      const value = raw == null ? null : typeof raw === "object" ? JSON.stringify(raw) : String(raw);
      switch (filter.operator) {
        case "is_empty":
          return value == null || value === "";
        case "is_not_empty":
          return value != null && value !== "";
        case "contains":
          return value != null && value.toLowerCase().includes(String(filter.value ?? "").toLowerCase());
        case "eq":
          return value === String(filter.value ?? "");
        case "neq":
          return value !== String(filter.value ?? "");
        case "lt":
          return Number(value) < Number(filter.value);
        case "lte":
          return Number(value) <= Number(filter.value);
        case "gt":
          return Number(value) > Number(filter.value);
        case "gte":
          return Number(value) >= Number(filter.value);
        default:
          return true;
      }
    });
  }

  if (controls.sorts.length > 0) {
    result.sort((a, b) => {
      for (const sort of controls.sorts) {
        const aVal = String((a.data as Record<string, unknown>)[sort.field_id] ?? "");
        const bVal = String((b.data as Record<string, unknown>)[sort.field_id] ?? "");
        const cmp = aVal.localeCompare(bVal);
        if (cmp !== 0) return sort.direction === "desc" ? -cmp : cmp;
      }
      return 0;
    });
  }

  return result;
}

export function parseLeadListControls(
  searchParams: URLSearchParams,
): LeadListControls | null {
  const controls: LeadListControls = { filters: [], sorts: [] };

  const filtersParam = searchParams.get("filters");
  if (filtersParam) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(filtersParam);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed)) return null;
    for (const item of parsed) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const filter = item as Record<string, unknown>;
      if (typeof filter.field_id !== "string") return null;
      if (!allowedListFields.has(filter.field_id)) return null;
      const operator = filter.operator as FilterOperator;
      if (!filterOperators.has(operator)) return null;
      controls.filters.push({ field_id: filter.field_id, operator, value: filter.value });
    }
  }

  const sortsParam = searchParams.get("sorts");
  if (sortsParam) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(sortsParam);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed)) return null;
    for (const item of parsed) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const sort = item as Record<string, unknown>;
      if (typeof sort.field_id !== "string") return null;
      if (!allowedListFields.has(sort.field_id)) return null;
      if (sort.direction !== "asc" && sort.direction !== "desc") return null;
      controls.sorts.push({ field_id: sort.field_id, direction: sort.direction });
    }
  }

  // Support simple stage filter param
  const stage = searchParams.get("stage");
  if (stage) {
    controls.filters.push({ field_id: "stage", operator: "eq", value: stage });
  }

  return controls;
}

function whereSql(controls: LeadListControls): { sql: string; params: DbParam[] } {
  const clauses: string[] = [];
  const params: DbParam[] = [];

  for (const filter of controls.filters) {
    if (!allowedListFields.has(filter.field_id)) continue;
    const column = quoteIdentifier(filter.field_id);
    switch (filter.operator) {
      case "is_empty":
        clauses.push(`(${column} is null or ${column} = '')`);
        break;
      case "is_not_empty":
        clauses.push(`(${column} is not null and ${column} <> '')`);
        break;
      case "contains":
        clauses.push(`lower(cast(${column} as char)) like ?`);
        params.push(`%${String(filter.value ?? "").toLowerCase()}%`);
        break;
      case "eq":
        clauses.push(`${column} = ?`);
        params.push(dbValue(filter.value));
        break;
      case "neq":
        clauses.push(`${column} <> ?`);
        params.push(dbValue(filter.value));
        break;
      case "lt":
        clauses.push(`${column} < ?`);
        params.push(dbValue(filter.value));
        break;
      case "lte":
        clauses.push(`${column} <= ?`);
        params.push(dbValue(filter.value));
        break;
      case "gt":
        clauses.push(`${column} > ?`);
        params.push(dbValue(filter.value));
        break;
      case "gte":
        clauses.push(`${column} >= ?`);
        params.push(dbValue(filter.value));
        break;
    }
  }

  return {
    sql: clauses.length > 0 ? ` where ${clauses.join(" and ")}` : "",
    params,
  };
}

function orderSql(controls: LeadListControls) {
  const clauses = controls.sorts.map(
    (sort) => `${quoteIdentifier(sort.field_id)} ${sort.direction === "desc" ? "desc" : "asc"}`,
  );
  // Default: fit_score DESC
  clauses.push(`${quoteIdentifier("fit_score")} desc`);
  clauses.push(`${quoteIdentifier("id")} asc`);
  return ` order by ${clauses.join(", ")}`;
}

export async function listLeads(
  pagination: PaginationParams = { limit: defaultPageLimit },
  controls: LeadListControls = { filters: [], sorts: [] },
): Promise<LeadListResult> {
  noStore();

  const offset = decodeCursor(pagination.cursor);
  if (offset === null) {
    return { leads: [], pagination: { limit: pagination.limit, hasMore: false } };
  }

  if (!hasDatabaseConnection()) {
    return pagedResult(filterAndSortLeads([], controls), pagination, offset);
  }

  const where = whereSql(controls);
  const rows = await queryRows<LeadDbRow>(
    `select ${selectSql()} from ${quoteIdentifier(leadTable)}${where.sql} ${orderSql(controls)} limit ? offset ?`,
    [...where.params, pagination.limit + 1, offset],
  );
  const hasMore = rows.length > pagination.limit;

  return {
    leads: rows.slice(0, pagination.limit).map(rowToLead),
    pagination: {
      limit: pagination.limit,
      ...(hasMore ? { nextCursor: encodeCursor(offset + pagination.limit) } : {}),
      hasMore,
    },
  };
}

export async function getLead(leadId: string): Promise<LeadRecord | null> {
  noStore();

  if (!hasDatabaseConnection()) {
    return null;
  }

  const rows = await queryRows<LeadDbRow>(
    `select ${selectSql()} from ${quoteIdentifier(leadTable)} where ${quoteIdentifier("id")} = ? limit 1`,
    [leadId],
  );

  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function updateLead(
  leadId: string,
  data: Record<string, unknown>,
): Promise<LeadRecord | null> {
  noStore();

  const updates = normalizeLeadUpdate(data);
  if (Object.keys(updates).length === 0) {
    return getLead(leadId);
  }

  if (!hasDatabaseConnection()) {
    return null;
  }

  const entries = Object.entries(updates);
  const setSql = entries.map(([key]) => `${quoteIdentifier(key)} = ?`).join(", ");
  await executeQuery(
    `update ${quoteIdentifier(leadTable)} set ${setSql}, ${quoteIdentifier("updated_at")} = current_timestamp where ${quoteIdentifier("id")} = ?`,
    [...entries.map(([, value]) => dbValue(value)), leadId],
  );
  return getLead(leadId);
}

export async function deleteLead(leadId: string): Promise<boolean> {
  noStore();

  if (!hasDatabaseConnection()) {
    return false;
  }

  const existing = await getLead(leadId);
  if (!existing) return false;
  await executeQuery(
    `delete from ${quoteIdentifier(leadTable)} where ${quoteIdentifier("id")} = ?`,
    [leadId],
  );
  return true;
}

export function toLeadResponse(lead: LeadRecord): AppRecordResponse {
  return {
    entity_id: leadEntityId,
    record_id: lead.id,
    data: {
      id: lead.id,
      ...lead.data,
    } satisfies Record<string, CanonicalFieldValue>,
    ...(lead.createdAt ? { created_at: lead.createdAt } : {}),
    ...(lead.updatedAt ? { updated_at: lead.updatedAt } : {}),
  };
}

export function toLeadListResponse(result: LeadListResult): AppRecordListResponse {
  return {
    entity_id: leadEntityId,
    records: result.leads.map(toLeadResponse),
    pagination: {
      limit: result.pagination.limit,
      ...(result.pagination.nextCursor ? { next_cursor: result.pagination.nextCursor } : {}),
      has_more: result.pagination.hasMore,
    },
  };
}
