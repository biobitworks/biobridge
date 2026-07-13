import { NextResponse } from "next/server";
import { hasDatabaseConnection, queryRows } from "@/lib/db";
import { readChainHead } from "@/lib/leads/custody-chain";
import { CURATED_CONTACTS } from "@/lib/leads/curated";
import type { RowDataPacket } from "mysql2";

export const maxDuration = 20;

/**
 * GET /api/graph-stats
 *
 * Two clearly-separated stat groups for judges:
 *  REAL graph (data app e05bbdc960b6): people / companies / vaulted emails are
 *  synced constants — the deployed app's DATABASE_URL points at its OWN database
 *  and cannot reach e05bbdc960b6 server-side. Custody events live in THIS app's
 *  own access_log and are read LIVE (they grow each time a judge unlocks).
 *  DEMO view: curated leads read LIVE from the leads table; curated contacts = 5.
 * Never errors: degrades to synced constants with a 200.
 */

const REAL_PEOPLE = 860;      // synced 2026-07-13 from e05bbdc960b6.people
const REAL_COMPANIES = 221;   // synced 2026-07-13 from e05bbdc960b6.companies
const REAL_VAULTED = 304;     // synced 2026-07-13 from e05bbdc960b6.private_vault

interface CountRow extends RowDataPacket { n: number }

async function safeCount(sql: string, fallback: number): Promise<{ value: number; live: boolean }> {
  if (!hasDatabaseConnection()) return { value: fallback, live: false };
  try {
    const rows = await queryRows<CountRow>(sql);
    const n = Number(rows[0]?.n);
    if (Number.isFinite(n)) return { value: n, live: true };
    return { value: fallback, live: false };
  } catch {
    return { value: fallback, live: false };
  }
}

export async function GET() {
  const custody = await safeCount("SELECT COUNT(*) AS n FROM access_log", 4);
  const demoLeads = await safeCount("SELECT COUNT(*) AS n FROM leads", 9);
  let custodyHead = "";
  try { custodyHead = await readChainHead(); } catch { custodyHead = ""; }

  return NextResponse.json(
    {
      custodyHead,
      real: {
        source: "GTM Relationship Graph (custody-sealed)",
        syncedAt: "2026-07-13",
        stats: [
          { id: "people", label: "People", value: REAL_PEOPLE, live: false, hint: "researchers & operators" },
          { id: "companies", label: "Companies", value: REAL_COMPANIES, live: false, hint: "labs, CROs & biotechs" },
          { id: "vaulted", label: "Vaulted private emails", value: REAL_VAULTED, live: false, hint: "tokenized, never exposed" },
          { id: "custody_events", label: "Custody events logged", value: custody.value, live: custody.live, hint: "hash-chained access_log" },
        ],
      },
      demo: {
        source: "Demo view (curated)",
        stats: [
          { id: "curated_leads", label: "Curated leads", value: demoLeads.value, live: demoLeads.live, hint: "live leads table" },
          { id: "curated_contacts", label: "Contacts revealed on unlock", value: CURATED_CONTACTS.length, live: false, hint: "via BIOBRIDGE-DEMO-2026" },
        ],
      },
    },
    { status: 200 },
  );
}
