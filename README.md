# BioBridge — a GTM AI Employee with Custody

**Bay Builders Hackathon · GrowthMasters × Kylon × Nimble · The GTM AI Employee Challenge**

BioBridge is a go-to-market AI employee for the biology-of-aging field. It finds real people and companies on the live web, researches and scores them, routes them into a pipeline you can work — and **seals every action in a tamper-evident custody chain**. You can hand the work to a judge, a teammate, or another agent and they can *audit exactly who touched which contact, when.*

- **Live app:** https://biobridge-pipeline.kylon.app
- **Demo video:** https://biobridge-pipeline.kylon.app/demo
- **AgentOS trace (evals):** https://app.theagentos.space/share/Ld_bBWEUNgnT9KWodMk6FHK62elb5oqj6BWvu13h43Y
- **Paper (Fractal Custody Objects, Lee 2026):** https://doi.org/10.5281/zenodo.21210575
- **Glasswork:** https://glasswork.butterbase.dev/

---

## What it does

1. **Find** — live web search (Nimble) turns a target market/protocol into real, source-linked leads. No mocks; every lead carries a source URL.
2. **Qualify & score** — each lead is scored on per-country regulatory fit and tagged by opportunity type (partnership / collaborator / customer / hire).
3. **Route** — leads flow into a Kanban pipeline (Discovered → … → Replied), plus table and calendar views.
4. **Prove** — every access to contact data is a hash-chained custody event. Private fields are tokenized and vaulted; the public custody hash rotates on every touch.

The graph holds **860 people and 221 companies** (aging researchers, founders, VCs, pharma), with **304 private emails tokenized and vaulted**.

## Why we built it this way

Most GTM tools give you a lead list. The judges (GrowthMasters) reward **systems thinking — scoring, routing, telemetry** — and knowing **where and when something happened, especially errors** (e.g. an agent contacting someone on a private channel it wasn't authorized to use).

BioBridge answers that with **custody**, based on our published method — Fractal Custody Objects (FCO) / Fractal Custody Graph (FCG):

- Every contact field is an FCO, addressable by its content hash.
- Every touch (read / write / **deny**) is a hash-chained custody event: `row_hash = sha256(prev_hash + payload)`. Break the chain and it's detectable.
- Each agent spins out from its own Merkle root; every action folds into a new head, so an agent's whole history is a self-sealing chain and agents interact without crossing each other's privacy boundary.
- **The oracle is a sealed golden path**: correctness is measured as deviation from a vault-sealed reference root, not judged. Errors aren't opinions — they're measured.

This is what lets BioBridge reach a **broad, distributed science network on public data while keeping private data sealed** — and prove every touch. That's the differentiator: not "we did outreach," but "here is the sealed record of every touch, and here is the error the instant it happened."

## How the tech integrates (for reviewers & agents)

| Tech | Role in BioBridge | Where to look |
|------|-------------------|---------------|
| **Nimble** | Live web = discovery + enrichment engine. Paste a Nimble key on the app → real-time search → qualify → custody-seal. Source-linked, no mocks. | `pipeline-app/lib/leads/discover.ts`, `scripts/run_gtm.py` |
| **Kylon** | The agentic workspace the AI employee lives in, the host for the app, and the custody **data store** (TiDB). The whole dashboard runs on Kylon; agents operate the pipeline. | `pipeline-app/` (deployed app) |
| **Butterbase** | **Model gateway** for Glasswork deterministic-core scoring: run one task across a model spread, pick the cheapest that passes the sealed golden root. (Butterbase = model gateway, *not* the custody store.) | `scripts/glasswork_score.py` |
| **AgentOS / AgentHog** | Tracing & evals. Every agent run and Nimble tool call is a traced span; judges open the public share link. | `scripts/agenthog_setup.py`, `scripts/quickstart_agent.py` |
| **Glasswork / FCG** | The custody + deterministic-audit backbone. Tokenized private fields, hash-chained access log, per-agent Merkle roots, recompute-or-reject. | `scripts/fcg.py`, `pipeline-app/lib/leads/custody-chain.ts` |

## For judges — one-time custody unlock

The graph and its stats are **viewable**, but private contact data stays **vaulted**. To see a curated demo of the private-contact layer:

1. Open **https://biobridge-pipeline.kylon.app** → the **Fractal Custody store** panel.
2. Paste the demo key and click **Unlock contacts**:

   ```
   BIOBRIDGE-DEMO-2026
   ```

3. This reveals a **curated demo** of contacts (fake `example.*` emails — real addresses never leave the vault) for a **one-time view**. Refresh → it re-locks.

**The unlock is itself a custody event.** Watch the *Custody events* counter tick up and the *public hash* rotate on each unlock — seeing private data costs a permanent, hashed log entry. That's the whole point. (Paste your own Nimble key instead of the demo key to run live enrichment.)

## Repo layout

- `pipeline-app/` — the deployed dashboard app (Board / stats / unlock / how-to), Next.js on Kylon.
- `scripts/` — the instrumented agent + audit tooling: `run_gtm.py` (Nimble GTM run), `quickstart_agent.py` (AgentHog-traced tool call), `glasswork_score.py` (Butterbase model scoring), `fcg.py` (custody binding), `agenthog_setup.py`.
- `docs/ARCHITECTURE.md` — the three-layer architecture in depth.
- `.env.example` — required keys (`NIMBLE_API_KEY`, `AGENTOS_API_KEY`, `AGENTOS_WORKSPACE_ID`, `BUTTERBASE_API_KEY`). No secrets are committed.

## Honest scope notes

- The live app's lead **table/calendar** show a curated 9-lead demo; the **860/221/304** graph is the full custody store (shown as stat cards + in the demo video).
- People/companies/vaulted stat cards are synced constants; the **custody-events counter and public hash are genuinely live** and climb on each unlock. Live-mutating people/company counts need a server-side key to the graph app — a planned addition.
- Live Nimble/Butterbase calls from the *hosted* app require a runtime key (a Kylon deployment can't hold custom env today); the app degrades gracefully to sealed results, and judges can paste their own key.

## License

MIT — see [LICENSE](./LICENSE).
