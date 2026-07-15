import "server-only";

import { createHash } from "node:crypto";
import { executeQuery, hasDatabaseConnection, queryRows } from "@/lib/db";
import { isExampleMode } from "@/lib/mode";
import type { RowDataPacket } from "mysql2";

/**
 * Real custody chain for the judge unlock.
 *
 * The access_log is a tamper-evident, hash-chained ledger. Each row's row_hash is
 *   sha256( prev_hash + JSON.stringify(payload, sortedKeys) )
 * where payload = { person, field, tier, actor, action, admitted } — matching the
 * Glasswork FCG binding (scripts/fcg.py). Unlocking the private-contact layer is
 * itself a custody event: it appends a status=granted entry, so the locked-state
 * chain head differs from the unlocked-state head. Recomputed, never faked.
 */

const GENESIS = "0".repeat(64);

export interface AccessLogRow extends RowDataPacket {
  id: string;
  person_id: string;
  field_name: string;
  tier: string;
  actor_type: string;
  actor_id: string;
  action: string;
  admitted: number;
  prev_hash: string;
  row_hash: string;
  ts: string;
  trace_id: string | null;
  span_id: string | null;
  seq: number;
}

interface TouchInput {
  personId: string;
  field: string;
  tier: string;
  actorType: string;
  actorId: string;
  action: string;
  admitted: boolean;
}

/** Canonical JSON with sorted keys, matching Python json.dumps(sort_keys=True). */
function canonicalJson(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}: ${JSON.stringify(payload[k])}`);
  return `{${parts.join(", ")}}`;
}

/** sha256(prev + canonicalJson(payload)) — the FCG row hash. */
export function chainHash(prevHash: string, input: TouchInput): string {
  const payload: Record<string, unknown> = {
    person: input.personId,
    field: input.field,
    tier: input.tier,
    actor: `${input.actorType}:${input.actorId}`,
    action: input.action,
    admitted: input.admitted,
  };
  return createHash("sha256").update(prevHash + canonicalJson(payload)).digest("hex");
}

function randomId(): string {
  return "al_" + createHash("sha256").update(String(Math.random()) + Date.now()).digest("hex").slice(0, 10);
}

/** Read the current chain head (row_hash of the last entry), or GENESIS if empty. */
export async function readChainHead(): Promise<string> {
  if (!hasDatabaseConnection()) return GENESIS;
  const rows = await queryRows<AccessLogRow>(
    "SELECT row_hash FROM access_log ORDER BY seq DESC LIMIT 1",
  );
  return rows[0]?.row_hash ?? GENESIS;
}

export async function readChain(limit = 50): Promise<AccessLogRow[]> {
  if (!hasDatabaseConnection()) return [];
  return queryRows<AccessLogRow>(
    "SELECT * FROM access_log ORDER BY seq ASC LIMIT ?",
    [limit],
  );
}

/** Verify the whole chain recomputes (recompute-or-reject). */
export async function verifyChain(): Promise<boolean> {
  const rows = await readChain(1000);
  let prev = rows[0]?.prev_hash ?? GENESIS;
  for (const r of rows) {
    const calc = chainHash(prev, {
      personId: r.person_id,
      field: r.field_name,
      tier: r.tier,
      actorType: r.actor_type,
      actorId: r.actor_id,
      action: r.action,
      admitted: Boolean(r.admitted),
    });
    if (calc !== r.row_hash) return false;
    prev = r.row_hash;
  }
  return true;
}

export interface GrantResult {
  id: string;
  lockedHash: string;   // chain head BEFORE the touch (locked state)
  unlockedHash: string; // chain head AFTER the touch (this grant's row_hash)
  actor: string;
  fields: string;
  ts: string;
  appended: boolean;    // false if DB unavailable (graceful degrade)
}

export interface GrantOptions {
  actorType?: string;
  actorId?: string;
  field?: string;
  personId?: string;
}

/**
 * Append a status=granted custody entry (a real, hash-chained access_log row) and
 * return the before/after hashes. Used by BOTH the curated demo unlock and the
 * live Nimble enrichment path — accessing/enriching the private layer is a logged
 * custody touch. If the DB is unavailable, still returns a recomputed unlockedHash
 * so the demo stays honest and never errors.
 */
export async function appendGrant(opts: GrantOptions = {}): Promise<GrantResult> {
  const actorType = opts.actorType ?? "judge";
  const actorId = opts.actorId ?? "judge-demo";
  const field = opts.field ?? "contacts+calendar+qualified";
  const personId = opts.personId ?? "biobridge-graph";
  const tier = "private";
  const action = "read";
  const admitted = true;

  const lockedHash = await readChainHead();
  const unlockedHash = chainHash(lockedHash, {
    personId, field, tier, actorType, actorId, action, admitted,
  });
  const id = randomId();
  const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
  const actor = `${actorType}:${actorId}`;

  let appended = false;
  if (hasDatabaseConnection() && !isExampleMode()) {
    try {
      await executeQuery(
        `INSERT INTO access_log
           (id, person_id, field_name, tier, actor_type, actor_id, action, admitted, prev_hash, row_hash, ts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, personId, field, tier, actorType, actorId, action, 1, lockedHash, unlockedHash, ts],
      );
      appended = true;
    } catch {
      appended = false;
    }
  }

  return { id, lockedHash, unlockedHash, actor, fields: field, ts, appended };
}

/** Curated demo unlock custody touch. */
export async function appendJudgeGrant(): Promise<GrantResult> {
  return appendGrant({ actorType: "judge", actorId: "judge-demo", field: "contacts+calendar+qualified" });
}
