import "server-only";

/**
 * AgentHog / AgentOS tracing hook.
 *
 * Emits spans for every GTM action (search, qualify, write) so each run is
 * observable in the AgentHog dashboard. Best-effort: tracing never blocks or
 * breaks the GTM motion. Endpoint + key are env-driven so the exact ingest URL
 * can be set without a code change.
 *
 *   AGENTOS_API_KEY   - bearer token for AgentHog ingest
 *   AGENTOS_TRACE_URL - ingest endpoint (defaults to app.theagentos.space)
 *   AGENTOS_PROJECT   - project/workspace slug (default "biobridge")
 */
const TRACE_URL =
  process.env.AGENTOS_TRACE_URL ?? "https://app.theagentos.space/api/v1/traces";
const PROJECT = process.env.AGENTOS_PROJECT ?? "biobridge";

export type Span = {
  name: string;
  status: "ok" | "error";
  attributes?: Record<string, unknown>;
  duration_ms?: number;
};

export async function emitSpan(span: Span): Promise<void> {
  const key = process.env.AGENTOS_API_KEY;
  if (!key) return; // tracing disabled without a key
  try {
    await fetch(TRACE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: PROJECT,
        ts: new Date().toISOString(),
        ...span,
      }),
      // never let tracing hang the request
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // swallow: observability is best-effort
  }
}

/** Wrap an async unit of work in a timed span. */
export async function traced<T>(
  name: string,
  attributes: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const out = await fn();
    void emitSpan({ name, status: "ok", attributes, duration_ms: Date.now() - start });
    return out;
  } catch (err) {
    void emitSpan({
      name,
      status: "error",
      attributes: { ...attributes, error: String(err) },
      duration_ms: Date.now() - start,
    });
    throw err;
  }
}

export const traceDashboardUrl = `https://app.theagentos.space/${PROJECT}`;
