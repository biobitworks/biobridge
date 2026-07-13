import { NextResponse } from "next/server";
import { DEMO_KEY, CURATED_CONTACTS } from "@/lib/leads/curated";
import { appendJudgeGrant } from "@/lib/leads/custody-chain";

export const maxDuration = 20;

/**
 * POST /api/leads/unlock  { key: string }
 *
 * One-time judge unlock. Entering the published demo key (BIOBRIDGE-DEMO-2026)
 * reveals CURATED, FAKE contacts + calendar/qualified/substance fields for this
 * view only — never real vaulted data. On refresh the client discards the result
 * and content re-locks.
 *
 * The unlock is ITSELF a custody event: it appends a status=granted, hash-chained
 * entry to the access_log, so the locked-state chain head differs from the
 * unlocked-state head (recomputed, not faked). The response carries the
 * before/after hashes and a "you're in the chain of custody" notification.
 *
 * A wrong/empty key returns locked:true with a friendly message (no error) and
 * appends NOTHING to the chain.
 */
export async function POST(request: Request) {
  let body: { key?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const key = (body.key ?? "").toString().trim();

  if (!key) {
    return NextResponse.json(
      { locked: true, message: "Enter the demo key to unlock the contact view." },
      { status: 200 },
    );
  }

  if (key !== DEMO_KEY) {
    // Non-demo key: stays locked, no error, no custody append.
    return NextResponse.json(
      { locked: true, message: "That key doesn't match the demo key. Try BIOBRIDGE-DEMO-2026." },
      { status: 200 },
    );
  }

  // Demo key: append the real granted custody entry, then reveal curated data.
  let grant;
  try {
    grant = await appendJudgeGrant();
  } catch {
    grant = null;
  }

  const shortHash = grant ? grant.unlockedHash.slice(0, 12) : "unavailable";
  const notification = grant
    ? `You accessed the private-contact layer. This access is now recorded in the custody chain — actor: ${grant.actor}, fields: ${grant.fields}, timestamp: ${grant.ts} UTC, hash: ${shortHash}.`
    : "You accessed the private-contact layer. This access is recorded in the custody chain.";

  return NextResponse.json(
    {
      locked: false,
      oneTimeView: true,
      contacts: CURATED_CONTACTS,
      custody: grant
        ? {
            entryId: grant.id,
            lockedHash: grant.lockedHash,
            unlockedHash: grant.unlockedHash,
            shortHash,
            actor: grant.actor,
            fields: grant.fields,
            ts: grant.ts,
            appended: grant.appended,
            notification,
          }
        : { notification, appended: false },
      message: `Unlocked ${CURATED_CONTACTS.length} curated contacts for this view. Refresh re-locks — real emails never leave the vault.`,
    },
    { status: 200 },
  );
}
