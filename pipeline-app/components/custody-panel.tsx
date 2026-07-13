'use client';

import { ShieldCheck, Loader2, Lock, Unlock, KeyRound, FileCheck2, CalendarClock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type CuratedContact = {
  name: string;
  role: string;
  affiliation: string;
  email: string;
  fit_score: number;
  opportunity: string;
  stage: string;
  qualified: boolean;
  next_step: string;
  next_step_date: string;
  regulatory_notes: string;
  outreach_draft: string;
  research_summary: string;
};

type CustodyGrant = {
  entryId?: string;
  lockedHash?: string;
  unlockedHash?: string;
  shortHash?: string;
  actor?: string;
  fields?: string;
  ts?: string;
  appended?: boolean;
  notification: string;
};

type CustodyState = {
  count: number | null;
  loading: boolean;
  error: string | null;
};

const DEMO_KEY = 'BIOBRIDGE-DEMO-2026';

type UnlockMode =
  | 'locked'
  | 'unlocking'
  | 'enriching'
  | 'unlocked-curated'
  | 'enriched-live'
  | 'bad-key';

/**
 * Custody Store panel — BioBridge is the GTM expression of Glasswork.
 * Shows the custody store count and gates private contact data behind a one-time
 * judge unlock key. Unlocking is itself a custody event: it appends a
 * hash-chained, status=granted access_log entry, so the locked hash differs from
 * the unlocked hash. All data revealed on unlock is curated/fake — no real emails.
 */
export function CustodyPanel() {
  const [state, setState] = useState<CustodyState>({ count: null, loading: true, error: null });
  const [keyInput, setKeyInput] = useState('');
  const [mode, setMode] = useState<UnlockMode>('locked');
  const [contacts, setContacts] = useState<CuratedContact[] | null>(null);
  const [grant, setGrant] = useState<CustodyGrant | null>(null);
  const [unlockMsg, setUnlockMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/leads/custody', { cache: 'no-store' });
      const data = (await res.json()) as { count?: number; error?: string };
      setState((s) => ({ ...s, count: data.count ?? 0, loading: false, error: data.error ?? null }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: String(err) }));
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const fireStatsRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('biobridge:stats-refresh'));
    }
  }, []);

  // Demo key -> curated unlock. Any other key -> live Nimble enrichment.
  const submit = useCallback(async () => {
    const key = keyInput.trim();
    if (!key) {
      setUnlockMsg('Enter the demo key for the curated view, or your Nimble key for live enrichment.');
      return;
    }

    if (key === DEMO_KEY) {
      setMode('unlocking'); setUnlockMsg(null);
      try {
        const res = await fetch('/api/leads/unlock', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        const data = (await res.json()) as {
          locked: boolean; contacts?: CuratedContact[]; custody?: CustodyGrant; message?: string;
        };
        if (!data.locked && data.contacts) {
          setContacts(data.contacts);
          setGrant(data.custody ?? null);
          setMode('unlocked-curated');
          setUnlockMsg(data.message ?? 'Unlocked for this view.');
          fireStatsRefresh(); // unlock is a custody event -> counter ticks up
        } else {
          setMode('locked'); setContacts(null); setGrant(null);
          setUnlockMsg(data.message ?? 'Locked.');
        }
      } catch {
        setMode('locked'); setContacts(null); setGrant(null);
        setUnlockMsg('Unlock is temporarily unavailable — private data stays sealed.');
      }
      return;
    }

    // Live Nimble enrichment path.
    setMode('enriching'); setUnlockMsg(null);
    try {
      const res = await fetch('/api/leads/discover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol: 'biology of aging', limit: 7, nimbleKey: key }),
      });
      const data = (await res.json()) as {
        mode?: string; inserted?: number; sealedTotal?: number;
        custody?: CustodyGrant; message?: string; traceUrl?: string;
      };
      setGrant(data.custody ?? null);
      if (data.mode === 'live') {
        setMode('enriched-live');
        setUnlockMsg(data.message ?? `Live enrichment ran — ${data.inserted ?? 0} new leads.`);
      } else {
        // bad/unauthorized key -> graceful sealed fallback, not an error.
        setMode('bad-key');
        setUnlockMsg(data.message ?? "That key didn't authorize live enrichment — data stays sealed.");
      }
      fireStatsRefresh(); // enrichment advanced the custody chain -> refetch stats
    } catch {
      setMode('bad-key');
      setUnlockMsg('Live enrichment is temporarily unavailable — data stays sealed.');
    }
  }, [keyInput, fireStatsRefresh]);

  const relock = useCallback(() => {
    setContacts(null);
    setGrant(null);
    setMode('locked');
    setUnlockMsg('Re-locked. Private data is sealed again.');
    setKeyInput('');
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Fractal Custody store</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {state.loading ? 'checking…' : `${state.count ?? 0} leads sealed`}
        </span>
      </div>

      {/* Judge one-time unlock */}
      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-background/60 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {contacts ? <Unlock className="size-3.5 text-emerald-600" /> : <Lock className="size-3.5" />}
          <span>Private contacts are vaulted. Judges: paste the demo key for a one-time view.</span>
        </div>

        {!contacts ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2">
              <KeyRound className="size-3.5 text-muted-foreground" />
              <input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={DEMO_KEY}
                className="w-56 bg-transparent py-1.5 text-sm outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
              />
            </div>
            <Button size="sm" variant="secondary" onClick={submit} disabled={mode === 'unlocking' || mode === 'enriching'}>
              {(mode === 'unlocking' || mode === 'enriching') ? <Loader2 className="size-4 animate-spin" /> : <Unlock className="size-4" />}
              {mode === 'unlocking' ? 'Unlocking…' : mode === 'enriching' ? 'Enriching…' : 'Unlock / Enrich'}
            </Button>
            <span className="text-xs text-muted-foreground">
              Demo key <code className="rounded bg-muted px-1">{DEMO_KEY}</code> → curated view · your Nimble key → live enrichment
            </span>

            {/* Live-enrichment result + custody event (shown in the input branch) */}
            {(mode === 'enriched-live' || mode === 'bad-key') && grant ? (
              <div className="w-full flex flex-col gap-1 rounded-md border border-amber-400/50 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-medium">
                  <FileCheck2 className="size-3.5" />
                  Added to the chain of custody
                </div>
                <p>{grant.notification}</p>
                {grant.lockedHash && grant.unlockedHash ? (
                  <div className="mt-1 grid grid-cols-1 gap-0.5 font-mono text-[10.5px] text-amber-800 sm:grid-cols-2">
                    <span>prev&nbsp;head: {grant.lockedHash.slice(0, 16)}…</span>
                    <span>new&nbsp;head: {grant.unlockedHash.slice(0, 16)}…</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Custody event notification — the sharp part: viewing private data is logged + hashed */}
            {grant ? (
              <div className="flex flex-col gap-1 rounded-md border border-amber-400/50 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-medium">
                  <FileCheck2 className="size-3.5" />
                  Added to the chain of custody
                </div>
                <p>{grant.notification}</p>
                {grant.lockedHash && grant.unlockedHash ? (
                  <div className="mt-1 grid grid-cols-1 gap-0.5 font-mono text-[10.5px] text-amber-800 sm:grid-cols-2">
                    <span>locked&nbsp;head: {grant.lockedHash.slice(0, 16)}…</span>
                    <span>unlocked&nbsp;head: {grant.unlockedHash.slice(0, 16)}…</span>
                  </div>
                ) : null}
                <span className="text-[10.5px] text-amber-700">
                  {grant.appended
                    ? 'This granted-access entry is appended to the tamper-evident access_log (status = granted).'
                    : 'Access recorded for this session; hashes recomputed live.'}
                </span>
              </div>
            ) : null}

            {/* Expanded curated reveal: contacts + stage/qualified + calendar next step */}
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">Name</th>
                    <th className="px-2 py-1">Role / Affiliation</th>
                    <th className="px-2 py-1">Email (demo)</th>
                    <th className="px-2 py-1">Stage</th>
                    <th className="px-2 py-1">Qualified</th>
                    <th className="px-2 py-1">Fit</th>
                    <th className="px-2 py-1">Next step (calendar)</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.email} className="border-t border-border align-top">
                      <td className="px-2 py-1 font-medium">{c.name}</td>
                      <td className="px-2 py-1 text-muted-foreground">
                        {c.role}<br /><span className="text-[10.5px]">{c.affiliation}</span>
                      </td>
                      <td className="px-2 py-1 font-mono text-[11px]">{c.email}</td>
                      <td className="px-2 py-1">{c.stage}</td>
                      <td className="px-2 py-1">
                        {c.qualified
                          ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">Qualified</span>
                          : <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">Not yet</span>}
                      </td>
                      <td className="px-2 py-1 tabular-nums">{c.fit_score}</td>
                      <td className="px-2 py-1 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-3" />
                          {c.next_step_date}
                        </span>
                        <br /><span className="text-[10.5px]">{c.next_step}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Substance fields revealed on unlock */}
            <div className="flex flex-col gap-2">
              {contacts.map((c) => (
                <details key={`d-${c.email}`} className="rounded-md border border-border bg-background/60 px-3 py-1.5 text-xs">
                  <summary className="cursor-pointer font-medium">{c.name} — research, outreach & regulatory</summary>
                  <div className="mt-1.5 flex flex-col gap-1 text-muted-foreground">
                    <p><span className="font-medium text-foreground">Research:</span> {c.research_summary}</p>
                    <p><span className="font-medium text-foreground">Regulatory:</span> {c.regulatory_notes}</p>
                    <p><span className="font-medium text-foreground">Outreach draft:</span> {c.outreach_draft}</p>
                  </div>
                </details>
              ))}
            </div>

            <Button size="sm" variant="ghost" onClick={relock} className="self-start">
              <Lock className="size-4" /> Re-lock
            </Button>
          </div>
        )}
        {unlockMsg ? <p className="text-xs text-emerald-700">{unlockMsg}</p> : null}
      </div>
    </div>
  );
}
