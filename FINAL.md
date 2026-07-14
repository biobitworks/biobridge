# BioBridge — Final Push Note

**This push adds only the FINAL DEMO VIDEO.** It is distinct from the 5:30 PM handoff (the 5 PM submission cut).

## What changed in this push
- Added `final-demo.mp4` — the after-cutoff final-demo video (narrated, integrates the full dashboard + a live custody unlock + the agent creator attestation).
- Nothing else in the submission was altered by this push; the 5:30 handoff build (live app, /how-to, README, 5 PM demo cut) stands as-is.

## Distinct from the 5:30 handoff
| | 5:30 PM handoff | This final-demo push |
|---|---|---|
| Video | 5 PM submission cut (/demo) | Final-demo cut (/final-demo) |
| Timing | at/before submission | after the 5 PM cutoff, "as if selected" |
| Adds | — | live custody-hash rotation on camera + agent creator hash |

## Hash timestamp — proof
The custody chain is live and time-anchored. Captured at final push:

- **Timestamp (UTC):** `2026-07-14T00:38:24Z`
- **Public custody hash:** `a4bbe45cc9b0c00c91c4897ee99cc99a6ddd425c402ec19b4ecf195d90cab8c4`
- **Live-unlock rotation shown in the video:** `d2bea2e9…` → `a4bbe45c…`
- **Agent creator hash (Vito authored):** `d0adbd846c6bda6789d53252212a298299fd66f307342b9e0d6ed3bf2396110f`

Verify any time against the live app:
```bash
curl -s https://biobridge-pipeline.kylon.app/api/graph-stats | python3 -c "import sys,json;print(json.load(sys.stdin)['custodyHead'])"
```
The value advances on each custody event (unlock/enrich), which is the point — every access is sealed and timestamped.
