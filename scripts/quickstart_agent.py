"""
BioBridge AgentOS quickstart — a traced agent that uses Nimble as its tool.

Follows the AgentHog quickstart: init from .env, decorate the tool with @tool
and the agent run with @traceable, so tool calls + the run show up as spans in
the AgentOS dashboard. Nimble is the live-web tool the agent calls.

    python scripts/quickstart_agent.py "longevity biotech founders in Japan"
"""
import os, sys, json, time
import requests
from dotenv import load_dotenv
import agenthog

load_dotenv()
agenthog.init(api_key=os.environ["AGENTOS_API_KEY"],
              workspace_id=os.environ.get("AGENTOS_WORKSPACE_ID"),
              agent_id="biobridge-gtm", kind="sync")

NIMBLE_URL = "https://sdk.nimbleway.com/v1/search"


@agenthog.tool(name="nimble_web_search")
def nimble_web_search(query: str, num_results: int = 6) -> list[dict]:
    """Live web search via Nimble. Returns [{title,url,country}]."""
    r = requests.post(
        NIMBLE_URL,
        headers={"Authorization": f"Bearer {os.environ['NIMBLE_API_KEY']}",
                 "Content-Type": "application/json"},
        json={"query": query, "num_results": num_results}, timeout=30)
    r.raise_for_status()
    return [{"title": x.get("title"), "url": x.get("url"),
             "country": (x.get("metadata") or {}).get("country_full")}
            for x in r.json().get("results", [])]


@agenthog.traceable(name="biobridge.gtm_agent")
def gtm_agent(objective: str) -> dict:
    """A GTM agent step: use the Nimble tool to find leads for an objective."""
    leads = nimble_web_search(objective, 6)         # traced tool call
    agenthog.emit("gtm.leads_found", {"objective": objective, "count": len(leads)})
    return {"objective": objective, "leads": leads}


def main() -> None:
    objective = sys.argv[1] if len(sys.argv) > 1 else "longevity biotech founders collaboration"
    out = gtm_agent(objective)
    agenthog.get_default_client().flush_blocking()
    time.sleep(1)
    print(json.dumps(out, indent=2)[:1400])


if __name__ == "__main__":
    main()
