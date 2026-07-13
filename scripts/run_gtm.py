"""
BioBridge — instrumented GTM discovery run.

Runs the search -> qualify -> route motion for a target market/protocol,
emitting a real AgentHog trace (search, qualify, route spans). Every run
produces a trace you can open and Share for judges.

    python scripts/run_gtm.py "biology of aging longevity biotech founders"
"""
import os
import sys
import json
import time
import requests
import agenthog
from agenthog_setup import init_agenthog

NIMBLE_URL = "https://sdk.nimbleway.com/v1/search"
REG_FIT = {
    "Japan": 92, "United Kingdom": 78, "United States": 70, "Singapore": 68,
    "Canada": 64, "China": 60, "Germany": 55,
}


def nimble_search(query: str, n: int) -> list[dict]:
    r = requests.post(
        NIMBLE_URL,
        headers={"Authorization": f"Bearer {os.environ['NIMBLE_API_KEY']}",
                 "Content-Type": "application/json"},
        json={"query": query, "num_results": n},
        timeout=30,
    )
    r.raise_for_status()
    return r.json().get("results", [])


def run(target: str, limit: int = 8) -> tuple[str, list[dict]]:
    with agenthog.start_task_run(agent_id="biobridge-gtm") as ctx:
        trid = ctx.task_run_id
        agenthog.emit("gtm.discover.start", {"target": target, "limit": limit}, task_run_id=trid)

        with agenthog.start_span(name="gtm.search"):
            results = nimble_search(target, limit)
            agenthog.emit("gtm.search",
                          {"target": target, "source": "nimble", "count": len(results)},
                          task_run_id=trid)

        with agenthog.start_span(name="gtm.qualify"):
            leads = []
            for r in results:
                country = (r.get("metadata") or {}).get("country_full", "United States")
                leads.append({
                    "org": (r.get("title") or "?")[:90],
                    "country": country,
                    "fit_score": REG_FIT.get(country, 50),
                    "url": r.get("url"),
                })
            leads.sort(key=lambda x: x["fit_score"], reverse=True)
            agenthog.emit("gtm.qualify",
                          {"qualified": len(leads),
                           "top_score": leads[0]["fit_score"] if leads else 0},
                          task_run_id=trid)

        with agenthog.start_span(name="gtm.route"):
            routed = [{**l, "stage": "new"} for l in leads]
            agenthog.emit("gtm.route", {"routed": len(routed)}, task_run_id=trid)

        agenthog.emit("gtm.discover.done", {"target": target, "leads": len(routed)}, task_run_id=trid)
        return trid, routed


def main() -> None:
    init_agenthog()
    target = sys.argv[1] if len(sys.argv) > 1 else \
        "biology of aging longevity biotech companies and founders collaboration"
    trid, leads = run(target)
    agenthog.get_default_client().flush_blocking()
    time.sleep(1)
    print("TASK_RUN_ID:", trid)
    print(json.dumps(leads, indent=2)[:1400])


if __name__ == "__main__":
    main()
