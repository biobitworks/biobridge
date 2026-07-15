/**
 * Example mode.
 *
 * The hackathon is over. BioBridge is no longer a live demo — it is a frozen,
 * read-only EXAMPLE. In this mode the app still demonstrates the full custody
 * mechanism (unlock reveals curated fake contacts, hashes recompute correctly),
 * but NO endpoint writes to the graph: appends, PATCH and DELETE are no-ops.
 * So using the example leaves no permanent edits — every visit is identical and
 * the chain head never moves.
 *
 * Set EXAMPLE_MODE=off only to intentionally re-open a live, writable demo.
 */
export function isExampleMode(): boolean {
  return (process.env.EXAMPLE_MODE ?? "on").toLowerCase() !== "off";
}
