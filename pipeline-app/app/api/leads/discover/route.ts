import { NextResponse } from "next/server";
import { discoverLeads } from "@/lib/leads/discover";
import { appendGrant } from "@/lib/leads/custody-chain";

export const maxDuration = 60;

/**
 * POST /api/leads/discover
 * Body: { protocol: string, limit?: number, nimbleKey?: string }
 *
 * nimbleKey is a JUDGE ONE-TIME key: used only for THIS request to run live
 * discovery, never stored, never logged, never returned. With no key, the
 * endpoint serves the sealed custody store (mode: "sealed"). Every failure
 * path returns a clean 200 with a human message — the button never errors out.
 */
export async function POST(request: Request) {
  let body: { protocol?: string; limit?: number; nimbleKey?: string } = {};
  try {
    body = await request.json();
  } catch {
    // tolerate empty/invalid body — treat as a sealed preview request
    body = {};
  }

  const protocol = (body.protocol ?? "biology of aging").toString().trim() || "biology of aging";
  const limit = Math.min(Math.max(Number(body.limit) || 7, 1), 20);
  const oneTimeKey =
    typeof body.nimbleKey === "string" && body.nimbleKey.trim() ? body.nimbleKey.trim() : undefined;

  try {
    const result = await discoverLeads(protocol, limit, oneTimeKey);

    // Live enrichment touches the private layer -> log a real custody event.
    let custody = null;
    if (oneTimeKey && result.mode === "live") {
      try {
        const grant = await appendGrant({
          actorType: "judge",
          actorId: "nimble-live",
          field: "live-enrichment:web+qualify+custody",
        });
        custody = {
          entryId: grant.id,
          lockedHash: grant.lockedHash,
          unlockedHash: grant.unlockedHash,
          shortHash: grant.unlockedHash.slice(0, 12),
          actor: grant.actor,
          fields: grant.fields,
          ts: grant.ts,
          appended: grant.appended,
          notification:
            `Live enrichment ran against the private layer. This access is now recorded in the custody chain — ` +
            `actor: ${grant.actor}, fields: ${grant.fields}, timestamp: ${grant.ts} UTC, hash: ${grant.unlockedHash.slice(0, 12)}.`,
        };
      } catch {
        custody = null;
      }
    }

    const message =
      result.mode === "live"
        ? `Live enrichment ran with your Nimble key — ${result.inserted} new leads, custody-sealed. Private data locks again on refresh.`
        : oneTimeKey
          ? `That key didn't authorize live enrichment — showing ${result.sealedTotal} custody-sealed leads instead.`
          : `Showing ${result.sealedTotal} custody-sealed leads. Paste a one-time Nimble key to run live discovery.`;
    // key is intentionally never echoed back
    return NextResponse.json({ ...result, custody, message }, { status: 200 });
  } catch (err) {
    // Even a hard failure degrades to a clean, honest response — no red error in the demo.
    return NextResponse.json(
      {
        protocol,
        inserted: 0,
        mode: "sealed",
        sealedTotal: 0,
        message:
          "Live discovery is temporarily unavailable; showing sealed custody results. (" +
          (err instanceof Error ? err.message : "unknown") +
          ")",
      },
      { status: 200 },
    );
  }
}
