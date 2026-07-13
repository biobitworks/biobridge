import "server-only";

/**
 * Butterbase custody backend client.
 * BioBridge is the GTM expression of Glasswork: every lead the agent discovers is
 * written to Butterbase, the deterministic custody store, and served over its public
 * Data API. Reads are public (no key); writes use the service key held server-side.
 */
const BB_APP_ID = process.env.BUTTERBASE_APP_ID ?? "app_n6aq7d2fejaj";
const BB_BASE = `https://api.butterbase.ai/v1/${BB_APP_ID}`;

export type ButterbaseLead = {
  id: string;
  org_name: string;
  org_type?: string | null;
  country?: string | null;
  city?: string | null;
  website?: string | null;
  capabilities?: string | null;
  protocol_match?: string | null;
  regulatory_status?: string | null;
  regulatory_notes?: string | null;
  fit_score?: number | null;
  stage?: string | null;
  contact_name?: string | null;
  contact_title?: string | null;
  contact_email?: string | null;
  outreach_draft?: string | null;
  research_summary?: string | null;
  source_url?: string | null;
  created_at?: string | null;
};

/** Public read — no key required. Used by the deployed app to show the live custody store. */
export async function readButterbaseLeads(limit = 100): Promise<ButterbaseLead[]> {
  const res = await fetch(`${BB_BASE}/leads?order=fit_score.desc&limit=${limit}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Butterbase read ${res.status}`);
  const data = (await res.json()) as ButterbaseLead[];
  return Array.isArray(data) ? data : [];
}

/** Write a lead into the custody store. Requires the service key (server-side only). */
export async function writeButterbaseLead(lead: ButterbaseLead): Promise<void> {
  const key = process.env.BUTTERBASE_API_KEY;
  if (!key) throw new Error("BUTTERBASE_API_KEY not set");
  const res = await fetch(`${BB_BASE}/leads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`Butterbase write ${res.status}`);
  }
}
