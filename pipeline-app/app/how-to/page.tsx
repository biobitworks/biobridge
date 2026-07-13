import Link from "next/link";
import { KeyRound, ShieldCheck, Radio, GitBranch, FileText, PlayCircle, Activity } from "lucide-react";

export const metadata = { title: "BioBridge — How to (for judges)" };

const REPO = "https://github.com/biobitworks/biobridge";
const TRACE = "https://app.theagentos.space/share/Ld_bBWEUNgnT9KWodMk6FHK62elb5oqj6BWvu13h43Y";
const PAPER = "https://doi.org/10.5281/zenodo.21210575";

export default function HowToPage() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-8 lg:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">How to — for judges</h1>
        <p className="text-sm text-muted-foreground">
          BioBridge is a GTM AI employee for biology-of-aging. Every output carries a
          Glasswork-style custody trail. Two minutes to see the whole loop.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Try the custody unlock</h2>
        <ol className="flex flex-col gap-3 text-sm">
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">1</span>
            <span>Open the <Link href="/" className="font-medium underline">Dashboard</Link>. Real-graph vs demo stats are labeled and color-split; the <strong>public custody hash</strong> is shown up top.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">2</span>
            <span>Go to <Link href="/leads" className="font-medium underline">Leads</Link> and find the <strong>Fractal Custody</strong> panel. Private contacts are vaulted.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">3</span>
            <span className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="size-4 text-muted-foreground" />
                Paste <code className="rounded bg-muted px-1 font-mono">BIOBRIDGE-DEMO-2026</code> → <strong>curated view</strong> (fake-but-realistic contacts, calendar next-steps, qualified status, research/outreach — one-time, re-locks on refresh).
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                …or paste <strong>your own Nimble key</strong> → <strong>live enrichment</strong>: real-time web results, qualified + custody-sealed, then the graph &amp; stats update.
              </span>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700"><ShieldCheck className="size-3.5" /></span>
            <span>
              Either action is a <strong>logged custody event</strong>: you&apos;re added to the chain of custody, the
              <span className="inline-flex items-center gap-1"> <Radio className="size-3 text-emerald-600" /> public hash changes</span>, and the custody-events counter climbs. Viewing private data is not free — it&apos;s hashed and provable.
            </span>
          </li>
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Links</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href={REPO} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <GitBranch className="size-4" /> GitHub repo
          </a>
          <a href={TRACE} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <Activity className="size-4" /> AgentOS trace
          </a>
          <a href="/demo" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <PlayCircle className="size-4" /> Demo video
          </a>
          <a href={PAPER} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <FileText className="size-4" /> Paper (Fractal Custody Objects)
          </a>
        </div>
      </section>
    </main>
  );
}
