"""
AgentHog setup for BioBridge.

Loads credentials from .env (per AgentOS docs) and initializes the AgentHog
client once. Import `init_agenthog()` before running any traced GTM motion.

    from dotenv import load_dotenv; load_dotenv()   # before agenthog.init()

Env (.env — never committed):
    AGENTOS_API_KEY        agops_...
    AGENTOS_WORKSPACE_ID   workspace id from the Quickstart
    NIMBLE_API_KEY         Nimble live-web search key
"""
import os
from dotenv import load_dotenv
import agenthog

_initialized = False


def init_agenthog(agent_id: str = "biobridge-gtm"):
    """Idempotently initialize AgentHog from .env. Returns the client."""
    global _initialized
    load_dotenv()
    key = os.environ.get("AGENTOS_API_KEY")
    if not key:
        raise RuntimeError("AGENTOS_API_KEY not set (see .env.example)")
    client = agenthog.init(
        api_key=key,
        workspace_id=os.environ.get("AGENTOS_WORKSPACE_ID"),
        agent_id=agent_id,
        kind="sync",
    )
    _initialized = True
    return client
