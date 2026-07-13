"""
BioBridge — lead finder.

Runs the GTM motion: Nimble live-web search -> regulatory qualification ->
scored, sourced leads. Every run emits an AgentHog trace for observability.

Usage:
    python src/lead_finder.py --protocol "human-neuron chimeric mouse" --limit 7
"""
import argparse
import os
import sys
import json
import requests

NIMBLE_SEARCH_URL = "https://sdk.nimbleway.com/v1/search"

# Per-country regulatory fit for sensitive protocols. Higher = more permissive/
# clearer pathway. Tuned for human-neuron chimeric research as the demo case.
REG_FIT = {
    "Japan": 92, "United Kingdom": 78, "United States": 70,
    "Singapore": 68, "Canada": 64, "Germany": 55, "China": 60,
}


def nimble_search(query: str, num_results: int) -> list[dict]:
    key = os.environ.get("NIMBLE_API_KEY")
    if not key:
        sys.exit("NIMBLE_API_KEY not set (see .env.example)")
    r = requests.post(
        NIMBLE_SEARCH_URL,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"query": query, "num_results": num_results},
        timeout=30,
    )
    r.raise_for_status()
    return r.json().get("results", [])


def qualify(lead: dict) -> dict:
    """Attach a regulatory-fit score. Country inferred from result metadata."""
    country = (lead.get("metadata") or {}).get("country_full") or "United States"
    lead["reg_country"] = country
    lead["fit_score"] = REG_FIT.get(country, 50)
    return lead


def trace(event: str, payload: dict) -> None:
    """Emit an observability event to AgentHog if configured (best-effort)."""
    key = os.environ.get("AGENTOS_API_KEY")
    if not key:
        return
    try:
        requests.post(
            "https://app.theagentos.space/api/traces",
            headers={"Authorization": f"Bearer {key}"},
            json={"event": event, "payload": payload},
            timeout=5,
        )
    except requests.RequestException:
        pass  # tracing is never allowed to block the GTM motion


def run(protocol: str, limit: int) -> list[dict]:
    query = f"labs companies researchers working on {protocol} collaboration partnership"
    trace("search.start", {"protocol": protocol, "limit": limit})
    raw = nimble_search(query, limit)
    leads = sorted((qualify(l) for l in raw), key=lambda x: x["fit_score"], reverse=True)
    trace("search.done", {"count": len(leads)})
    return leads


def main() -> None:
    ap = argparse.ArgumentParser(description="BioBridge lead finder")
    ap.add_argument("--protocol", required=True, help="Target research protocol / market")
    ap.add_argument("--limit", type=int, default=7)
    args = ap.parse_args()

    leads = run(args.protocol, args.limit)
    for i, l in enumerate(leads, 1):
        print(f"{i:>2}. [{l['fit_score']:>3}] {l.get('title','')[:70]}")
        print(f"     {l['reg_country']} · {l.get('url','')}")
    print(json.dumps({"protocol": args.protocol, "leads": len(leads)}, indent=2))


if __name__ == "__main__":
    main()
