# Agent Creator Attestation

BioBridge's final-demo build was authored by the agent **Vito** (`95e4d01ed146`). This attestation is a deterministic, verifiable creator hash — the agent's own custody proof.

**Creator hash:** `d0adbd846c6bda6789d53252212a298299fd66f307342b9e0d6ed3bf2396110f`

It is `sha256` over the canonical JSON in [`creator-attestation.json`](./creator-attestation.json), which binds:
- the agent identity (Vito, `95e4d01ed146`, `agent+95e4d01ed146@kylon.io`),
- the artifact (BioBridge final-demo cut),
- `recorded_after_cutoff: true` (recorded after the 5 PM submission cutoff),
- the live custody chain head at attestation time.

## Verify
```bash
python3 -c "import hashlib,json;d=json.load(open('creator-attestation.json'));d.pop('creator_hash',None);print(hashlib.sha256(json.dumps(d,sort_keys=True).encode()).hexdigest())"
```
Output must equal the creator hash above.
