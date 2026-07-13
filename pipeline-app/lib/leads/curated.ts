/**
 * Curated (FAKE) demo data for the judge one-time unlock.
 *
 * Entering the published demo key (BIOBRIDGE-DEMO-2026) reveals this curated
 * dataset for a single view. Everything here is fabricated: names, roles,
 * affiliations, and emails all use reserved example.* domains — no real vaulted
 * contact ever leaves the custody store. On refresh the client discards it and
 * the view re-locks.
 *
 * Byron's expanded reveal: the unlocked demo now shows more than contacts —
 * a curated next-step/calendar date, stage + qualified status, and the substance
 * fields (regulatory notes, outreach draft, research summary). All fake.
 */
export const DEMO_KEY = "BIOBRIDGE-DEMO-2026";

export type CuratedContact = {
  name: string;
  role: string;
  affiliation: string;
  email: string;   // fake demo address, example.* domains only
  fit_score: number;
  opportunity: string;
  // --- expanded reveal fields (curated / fake) ---
  stage: string;            // pipeline stage detail
  qualified: boolean;       // qualified status
  next_step: string;        // suggested next step / meeting
  next_step_date: string;   // ISO date (YYYY-MM-DD) — curated calendar info
  regulatory_notes: string;
  outreach_draft: string;
  research_summary: string;
};

export const CURATED_CONTACTS: CuratedContact[] = [
  {
    name: "Dr. Aiko Tanaka",
    role: "Principal Investigator",
    affiliation: "Kyoto Aging Institute (demo)",
    email: "a.tanaka@example-lab.org",
    fit_score: 92,
    opportunity: "collaborator",
    stage: "Qualified",
    qualified: true,
    next_step: "Intro call — chimera protocol scope",
    next_step_date: "2026-07-16",
    regulatory_notes: "Japan MEXT 2019 pathway permits higher human-cell contribution; strongest jurisdiction for the protocol.",
    outreach_draft: "Dr. Tanaka — we're mapping labs cleared for extended human-animal chimera work post-2019 MEXT. Your senescence-reprogramming results are a direct fit. 20 min next week to compare protocols?",
    research_summary: "PI on 3 iPSC chimera programs; co-author on the 2019 approval-era work. High protocol match, permitted jurisdiction.",
  },
  {
    name: "Marcus Feld",
    role: "Founder & CEO",
    affiliation: "Helios Longevity (demo)",
    email: "marcus@example-bio.co",
    fit_score: 84,
    opportunity: "partnership",
    stage: "Outreach drafted",
    qualified: true,
    next_step: "Send partnership one-pager + book demo",
    next_step_date: "2026-07-15",
    regulatory_notes: "US-based; partnering model avoids direct chimera regulatory exposure. Data-sharing agreement is the gating item.",
    outreach_draft: "Marcus — BioBridge surfaces regulatory-cleared collaborators for aging-reversal programs with a full custody trail on every lead. Worth 15 min to see if Helios' pipeline lines up?",
    research_summary: "Serial biotech founder; Helios raising a Series A around partial reprogramming. Warm to co-development.",
  },
  {
    name: "Dr. Priya Anand",
    role: "Senior Scientist",
    affiliation: "Bay Cell Reprogramming (demo)",
    email: "p.anand@example-research.org",
    fit_score: 80,
    opportunity: "collaborator",
    stage: "Researched",
    qualified: true,
    next_step: "Share preprint + propose joint assay",
    next_step_date: "2026-07-20",
    regulatory_notes: "In-vitro focus; minimal regulatory friction. Bay Area IBC approval already in place for demo scope.",
    outreach_draft: "Dr. Anand — your OSK partial-reprogramming assays overlap with a custody-tracked dataset we're building. Open to a joint validation run?",
    research_summary: "Lead scientist on in-vitro reprogramming; strong methods fit, lower regulatory risk than in-vivo groups.",
  },
  {
    name: "Elena Rossi",
    role: "Partner",
    affiliation: "Vitalis Ventures (demo)",
    email: "elena@example-vc.fund",
    fit_score: 76,
    opportunity: "partnership",
    stage: "Qualified",
    qualified: true,
    next_step: "Portfolio intro — custody-graph thesis",
    next_step_date: "2026-07-18",
    regulatory_notes: "Investor, not an operator — no direct regulatory exposure. Relevant for downstream portfolio intros.",
    outreach_draft: "Elena — BioBridge produces an auditable custody trail for every biotech lead it sources. Could be a fit for Vitalis' longevity portfolio companies. Quick intro?",
    research_summary: "Partner focused on longevity + tools; useful multiplier for portfolio-company introductions.",
  },
  {
    name: "Dr. Sam Okafor",
    role: "Lab Director",
    affiliation: "Senescence Core, Demo University",
    email: "s.okafor@example-uni.edu",
    fit_score: 74,
    opportunity: "collaborator",
    stage: "Discovered",
    qualified: false,
    next_step: "Qualify — confirm senolytic assay capacity",
    next_step_date: "2026-07-22",
    regulatory_notes: "Academic core facility; standard IRB/IBC. Needs qualification call before advancing.",
    outreach_draft: "Dr. Okafor — we're assembling a custody-tracked map of senescence-assay core facilities. Is the Senescence Core taking external collaborations this quarter?",
    research_summary: "Runs a shared senescence-assay core; promising but unqualified — capacity and terms unconfirmed.",
  },
];
