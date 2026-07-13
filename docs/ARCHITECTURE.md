# BioBridge — Architecture

BioBridge is a GTM AI employee for the biology-of-aging field. It finds and researches real people (researchers, founders, VCs, organizers) via live web data, routes them into a pipeline, and — the differentiator — **every action is custody-sealed**: provable, privacy-tiered, and auditable.

## Three layers

### 1. Discovery (Nimble)
Live web search → per-country regulatory qualification → scored, sourced leads. No mocks; every lead carries a source URL. Traced in AgentHog (`gtm.search → gtm.qualify → gtm.route`).

### 2. Custody-gated access (the differentiator)
Built on the Fractal Custody Objects method (Lee, B., Zenodo 10.5281/zenodo.21210575).

- **Field tiers.** Each contact field is `public` (name, title, affiliation, field, public LinkedIn, source) or `private` (personal email, phone, IP / trade secret, notes). Public flows for outreach; private is vaulted.
- **Access grants.** The private tier is readable only by the owner and explicitly granted agents. Everyone else is denied — enforced, not by convention.
- **Tamper-evident access log.** Every touch (read/write/release/deny) is hash-chained: `row_hash = sha256(prev_hash + payload)`. A break in the chain is detectable, so *who touched what, when* cannot be forged.
- **Per-agent Merkle roots.** Each agent spins out from its own genesis root; every action it touches folds into a new head (`agent_root.current_root`). Agents interact without crossing each other's privacy boundary, and each agent's entire action history is a self-sealing custody chain. **This is the core of the AI worker.**

### 3. Deterministic core scoring (Glasswork / Butterbase)
The extraction core is scored the Glasswork way: run one fixed task across a spread of Butterbase models, compare each output's Merkle root to a **sealed golden path** (the oracle / yardstick), and pick the cheapest model that passes the precision/recall bar.

- The golden root is sealed once; nothing re-defines "correct." Errors aren't judged, they're **measured** as deviation from the golden path.
- Live result (8 models): all matched the golden root; cheapest-that-passes was `deepseek-chat` (112 tokens). Notably `gemma-2-27b` (113 tok) beat `gpt-oss-120b` (240 tok) — bigger doesn't win; you only know by measuring. (`scripts/glasswork_score.py`)

## The pitch in one line
An AI worker where every action carries its own custody root — reach a broad, distributed science network on public data, keep private data sealed, and prove every touch. That's the differentiator.
