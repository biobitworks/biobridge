import "server-only";
import { executeQuery, queryRows, quoteIdentifier } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { randomUUID } from "node:crypto";
import { traced, emitSpan } from "@/lib/trace/agenthog";
import { writeButterbaseLead, type ButterbaseLead } from "@/lib/leads/butterbase";

const NIMBLE_SEARCH_URL = "https://sdk.nimbleway.com/v1/search";

// Per-country regulatory fit for sensitive protocols (higher = clearer legal pathway).
// Japan leads: 2019 MEXT revision permits high human-cell-contribution chimera work.
const REG_FIT: Record<string, number> = {
  Japan: 92, "United Kingdom": 78, "United States": 70, Singapore: 68,
  Canada: 64, China: 60, Germany: 55,
};

type NimbleResult = {
  title?: string;
  url?: string;
  description?: string;
  metadata?: { country_full?: string };
};

async function nimbleSearch(query: string, limit: number, providedKey?: string): Promise<NimbleResult[]> {
  const key = providedKey || process.env.NIMBLE_API_KEY;
  if (!key) return []; // no key at all: caller falls back to sealed custody store
  const res = await fetch(NIMBLE_SEARCH_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      focus: "general",
      search_depth: "lite",
      max_results: limit,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Nimble ${res.status}`);
  const data = (await res.json()) as { results?: NimbleResult[] };
  return data.results ?? [];
}

export type DiscoverResult = {
  protocol: string;
  inserted: number;
  mode: "live" | "sealed";
  sealedTotal: number;
  traceUrl: string;
};

/**
 * Live GTM discovery — the BioBridge agent motion, GTM-of-Glasswork:
 * 1) search the live web via Nimble, 2) qualify by regulatory fit,
 * 3) write scored leads into the Butterbase custody store.
 * Each phase emits an AgentHog span for the trace dashboard.
 */
export async function discoverLeads(protocol: string, limit = 7, oneTimeKey?: string): Promise<DiscoverResult> {
  const query = `contract research organization lab company services ${protocol} preclinical`;

  const results = await traced("gtm.search", { protocol, limit, source: "nimble" }, () =>
    nimbleSearch(query, limit, oneTimeKey),
  );

  const qualified: ButterbaseLead[] = results.map((r) => {
    const country = r.metadata?.country_full ?? "United States";
    const fit = REG_FIT[country] ?? 50;
    return {
      id: `disc_${randomUUID().slice(0, 12)}`,
      org_name: (r.title ?? "Unknown").slice(0, 240),
      country,
      fit_score: fit,
      regulatory_status: fit >= 80 ? "permitted" : fit >= 60 ? "restricted" : "unknown",
      source_url: r.url ?? null,
      research_summary: (r.description ?? "").slice(0, 480) || null,
      protocol_match: "partial",
      stage: "discovered",
    };
  });
  void emitSpan({
    name: "gtm.qualify",
    status: "ok",
    attributes: { protocol, qualified: qualified.length },
  });

  await traced("gtm.custody_write", { protocol, count: qualified.length }, async () => {
    for (const l of qualified) {
      await writeButterbaseLead(l);
    }
  });

  const countRows = await queryRows<RowDataPacket>(
    `select count(*) as n from ${quoteIdentifier("leads")}`,
    [],
  );
  const sealedTotal = Number((countRows[0] as { n?: number })?.n ?? 0);

  return {
    protocol,
    inserted: qualified.length,
    mode: qualified.length > 0 ? "live" : "sealed",
    sealedTotal,
    traceUrl: `https://app.theagentos.space/${process.env.AGENTOS_PROJECT ?? "biobridge"}`,
  };
}
