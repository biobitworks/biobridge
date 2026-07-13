"""
Fractal Custody Graph binding for BioBridge.

Binds the three chains into ONE verifiable FCG:
  1. AgentHog trace span (what a run did)  ->  provides trace_id / span_id
  2. access_log touch (every FCO read/write/deny), hash-chained, STAMPED with
     the originating trace_id + span_id
  3. agent_root, whose current_root folds in the access_log head

Result: for any FCO touch you can prove which trace caused it, when, by which
agent — and the agent's lifetime root covers every touch it made. One FCO,
one FCG, one provable graph.
"""
import hashlib, json, uuid
from typing import Optional

def _h(prev: str, payload: dict) -> str:
    return hashlib.sha256((prev + json.dumps(payload, sort_keys=True)).encode()).hexdigest()

def admits(grants: set, actor_type: str, actor_id: str, tier: str) -> bool:
    return True if tier == "public" else (actor_type, actor_id) in grants

def touch(*, prev_hash: str, person_id: str, field: str, tier: str,
          actor_type: str, actor_id: str, action: str,
          trace_id: str, span_id: str, grants: set) -> dict:
    """Produce one FCO custody touch, bound to its trace/span. Returns the row."""
    admitted = admits(grants, actor_type, actor_id, tier)
    act = action if admitted else "deny"
    payload = {"person": person_id, "field": field, "tier": tier,
               "actor": f"{actor_type}:{actor_id}", "action": act,
               "admitted": admitted, "trace_id": trace_id, "span_id": span_id}
    row_hash = _h(prev_hash, payload)
    return {"id": "al_" + uuid.uuid4().hex[:10], "person_id": person_id,
            "field_name": field, "tier": tier, "actor_type": actor_type,
            "actor_id": actor_id, "action": act, "admitted": admitted,
            "prev_hash": prev_hash, "row_hash": row_hash,
            "trace_id": trace_id, "span_id": span_id}

def fold_agent_root(current_root: str, access_log_head: str) -> str:
    """Fold the access_log head into the agent root -> new lifetime root."""
    return _h(current_root, {"access_log_head": access_log_head})

def verify_chain(rows: list[dict]) -> bool:
    """Recompute-or-reject: verify the access_log hash chain is intact."""
    prev = rows[0]["prev_hash"] if rows else "0" * 64
    for r in rows:
        payload = {"person": r["person_id"], "field": r["field_name"], "tier": r["tier"],
                   "actor": f'{r["actor_type"]}:{r["actor_id"]}', "action": r["action"],
                   "admitted": bool(r["admitted"]), "trace_id": r["trace_id"], "span_id": r["span_id"]}
        if _h(prev, payload) != r["row_hash"]:
            return False
        prev = r["row_hash"]
    return True
