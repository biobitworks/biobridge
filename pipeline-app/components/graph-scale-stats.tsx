"use client";

import { useEffect, useState } from "react";
import { Database, FlaskConical, Radio, Fingerprint } from "lucide-react";

interface Stat {
  id: string;
  label: string;
  value: number;
  live: boolean;
  hint: string;
}
interface StatsResponse {
  custodyHead: string;
  real: { source: string; syncedAt: string; stats: Stat[] };
  demo: { source: string; stats: Stat[] };
}

function StatCard({ stat, tone }: { stat: Stat; tone: "real" | "demo" }) {
  return (
    <div
      className={
        "flex min-w-0 flex-col items-start overflow-hidden rounded-xl border px-5 py-3 " +
        (tone === "real"
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-sky-500/40 bg-sky-500/5")
      }
    >
      <p className="flex w-full items-center gap-1.5 truncate text-label-md text-tertiary-foreground">
        {stat.label}
        {stat.live ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            <Radio className="size-2.5" /> live
          </span>
        ) : null}
      </p>
      <p className="mt-1 w-full truncate text-headline-lg text-inverse tabular-nums">
        {stat.value.toLocaleString()}
      </p>
      <p className="mt-1 w-full truncate text-body-md text-muted-foreground">{stat.hint}</p>
    </div>
  );
}

/**
 * Two clearly-labeled stat groups so judges instantly tell REAL graph data from
 * the DEMO curated subset. Real = emerald, Demo = sky, with a small badge legend.
 */
export function GraphScaleStats() {
  const [data, setData] = useState<StatsResponse | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/graph-stats", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: StatsResponse) => { if (alive) setData(d); })
        .catch(() => { /* graceful: cards just won't render */ });
    };
    load();
    // Refetch immediately after an unlock or live enrichment writes custody events.
    const onRefresh = () => load();
    window.addEventListener("biobridge:stats-refresh", onRefresh);
    return () => {
      alive = false;
      window.removeEventListener("biobridge:stats-refresh", onRefresh);
    };
  }, []);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Public custody hash — advances on every unlock / enrichment */}
      {data.custodyHead ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 text-label-md font-medium text-secondary-foreground">
            <Fingerprint className="size-4 text-emerald-600" /> Public custody hash
          </span>
          <code className="rounded bg-background px-2 py-0.5 font-mono text-[11px] text-foreground">
            {data.custodyHead}
          </code>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            <Radio className="size-2.5" /> live
          </span>
          <span className="text-body-sm text-muted-foreground">changes on each custody event (unlock / enrich)</span>
        </div>
      ) : null}

      {/* REAL DATA */}
      <section aria-label="Real graph data" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-label-md font-medium text-emerald-700">
            <Database className="size-3.5" /> Real graph — custody-sealed
          </span>
          <span className="text-body-sm text-muted-foreground">
            full relationship graph &amp; custody layer · synced {data.real.syncedAt}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.real.stats.map((s) => <StatCard key={s.id} stat={s} tone="real" />)}
        </div>
      </section>

      {/* DEMO DATA */}
      <section aria-label="Demo curated data" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2 py-0.5 text-label-md font-medium text-sky-700">
            <FlaskConical className="size-3.5" /> Demo view — curated
          </span>
          <span className="text-body-sm text-muted-foreground">
            the walkthrough subset judges interact with below
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.demo.stats.map((s) => <StatCard key={s.id} stat={s} tone="demo" />)}
        </div>
      </section>
    </div>
  );
}
