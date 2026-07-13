# biobridge
## For judges — one-time custody unlock

The relationship graph and its stats are **viewable**, but private contact data stays **vaulted**. To see a curated demo of the private-contact layer:

1. Open the live app: **https://biobridge-pipeline.kylon.app**
2. Find the **Fractal Custody store** panel on the dashboard.
3. Paste the demo key and click **Unlock contacts**:

```
BIOBRIDGE-DEMO-2026
```

This reveals a **curated demo** of contacts (fake `example.*` emails — real addresses never leave the vault) for a **one-time view**. Refresh, and it **re-locks**. The unlock is itself a custody event: seeing private data costs a permanent, hashed log entry — that's the point.

## Links
- **Live app:** https://biobridge-pipeline.kylon.app
- **Demo video:** https://biobridge-pipeline.kylon.app/demo
- **AgentOS trace (evals):** https://app.theagentos.space/share/Ld_bBWEUNgnT9KWodMk6FHK62elb5oqj6BWvu13h43Y
- **Fractal Custody Objects (paper):** https://doi.org/10.5281/zenodo.21210575
- **Glasswork:** https://glasswork.butterbase.dev/

## App source
The deployed dashboard app (Board, judge unlock, custody stats, how-to) lives in [`pipeline-app/`](./pipeline-app). Live at https://biobridge-pipeline.kylon.app
