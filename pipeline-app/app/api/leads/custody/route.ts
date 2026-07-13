import { NextResponse } from "next/server";
import { readButterbaseLeads } from "@/lib/leads/butterbase";

export const maxDuration = 30;

/**
 * GET /api/leads/custody
 * Reads the live Butterbase custody store (public Data API, no secret needed).
 * BioBridge is the GTM expression of Glasswork: this is the deterministic,
 * traceable store every discovered lead is written to.
 */
export async function GET() {
  try {
    const leads = await readButterbaseLeads(100);
    return NextResponse.json({ source: "butterbase", count: leads.length, leads });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
