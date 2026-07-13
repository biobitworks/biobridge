"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import type { ActiveDotProps, DotItemDotProps } from "recharts";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { leadRegulatoryStatusOptions, leadStageOptions } from "@/lib/leads/metadata";
import type { Lead, LeadDrilldownScope } from "@/lib/leads/types";

interface SummaryMetric {
  id: string;
  label: string;
  aggregate: "count" | "sum" | "avg" | "percent_true";
  format?: "number" | "currency" | "percent";
  getValue: (lead: Lead) => unknown;
}

interface DashboardChart {
  id: string;
  label: string;
  description: string;
  kind: "stage" | "regulatory" | "created" | "fit_score";
}

interface ChartSliceDatum {
  key: string;
  label: string;
  value: number;
  leads: Lead[];
  fill?: string;
  name?: string;
  sort?: number;
}

export interface DashboardOverviewProps {
  leads: Lead[];
  onOpenDrilldown: (scope: LeadDrilldownScope) => void;
}

const METRIC_TRENDS: Record<string, { value: string; tone: "success" | "warning" | "muted"; suffix?: string }> = {
  leads: { value: "+18%", tone: "success", suffix: "vs last week" },
  avg_fit_score: { value: "+3pts", tone: "success", suffix: "vs last week" },
  qualified: { value: "+5%", tone: "success", suffix: "vs last week" },
  permitted: { value: "Steady", tone: "muted" },
};

const CHART_PRIMARY = "var(--chart-1)";
const CHART_SECONDARY = "var(--chart-2)";

const DASHBOARD_SUMMARIES: SummaryMetric[] = [
  {
    id: "leads",
    label: "Total leads",
    aggregate: "count",
    getValue: (lead) => lead.id,
  },
  {
    id: "avg_fit_score",
    label: "Avg fit score",
    aggregate: "avg",
    format: "number",
    getValue: (lead) => lead.fitScore,
  },
  {
    id: "qualified",
    label: "Qualified+",
    aggregate: "count",
    getValue: (lead) =>
      ["qualified", "drafted", "sent", "replied"].includes(lead.stage ?? "") ? lead.id : null,
  },
  {
    id: "permitted",
    label: "Permitted",
    aggregate: "count",
    getValue: (lead) => (lead.regulatoryStatus === "permitted" ? lead.id : null),
  },
];

const DASHBOARD_CHARTS: DashboardChart[] = [
  {
    id: "stage_mix",
    label: "Pipeline by stage",
    description: "Lead count grouped by stage.",
    kind: "stage",
  },
  {
    id: "regulatory_mix",
    label: "Regulatory status",
    description: "Lead count grouped by regulatory status.",
    kind: "regulatory",
  },
  {
    id: "created_growth",
    label: "Pipeline growth",
    description: "Cumulative leads by created date.",
    kind: "created",
  },
  {
    id: "fit_score_dist",
    label: "Fit score distribution",
    description: "Lead count grouped by fit score bucket.",
    kind: "fit_score",
  },
];

function metricValue(metric: SummaryMetric, leads: Lead[]) {
  const values = leads.map(metric.getValue).filter((value) => value != null && value !== "");
  const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  switch (metric.aggregate) {
    case "count":
      return values.length;
    case "sum":
      return numbers.reduce((sum, value) => sum + value, 0);
    case "avg":
      return numbers.length === 0 ? 0 : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
    case "percent_true": {
      const trueCount = values.filter((value) => value === true || value === "true" || value === 1).length;
      return values.length === 0 ? 0 : trueCount / values.length;
    }
  }
}

function formatMetric(metric: SummaryMetric, value: number) {
  if (metric.format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: value >= 100000 ? 0 : 1,
      notation: value >= 100000 ? "compact" : "standard",
    }).format(value);
  }
  if (metric.format === "percent") {
    const normalized = Math.abs(value) <= 1 ? value : value / 100;
    return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(normalized);
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function buildStageData(leads: Lead[]): ChartSliceDatum[] {
  const rows: ChartSliceDatum[] = leadStageOptions.map((option) => {
    const matchingLeads = leads.filter((lead) => lead.stage === option.value);
    return {
      key: option.value,
      label: option.label,
      value: matchingLeads.length,
      leads: matchingLeads,
    };
  });

  const configuredStages = new Set<string>(leadStageOptions.map((option) => option.value));
  const uncategorizedLeads = leads.filter(
    (lead) => !configuredStages.has(String(lead.stage ?? "")),
  );
  if (uncategorizedLeads.length > 0) {
    rows.push({
      key: "uncategorized",
      label: "Uncategorized",
      value: uncategorizedLeads.length,
      leads: uncategorizedLeads,
    });
  }

  return rows;
}

function buildRegulatoryData(leads: Lead[]): ChartSliceDatum[] {
  return leadRegulatoryStatusOptions.map((option) => {
    const matchingLeads = leads.filter((lead) => lead.regulatoryStatus === option.value);
    return {
      key: option.value,
      label: option.label,
      name: option.label,
      value: matchingLeads.length,
      leads: matchingLeads,
      fill: `var(--chart-${leadRegulatoryStatusOptions.indexOf(option) + 1})`,
    };
  });
}

function timelineBucket(rawDate: string | null | undefined) {
  const date = rawDate ? new Date(rawDate) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { key: "undated", label: "Undated", sort: Number.MAX_SAFE_INTEGER };
  }

  return {
    key: date.toISOString().slice(0, 10),
    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    sort: date.getTime(),
  };
}

// Relies on the entity API passing record created_at through to the client.
function buildCreatedGrowthData(leads: Lead[]): ChartSliceDatum[] {
  const dated = leads
    .map((lead) => ({ lead, bucket: timelineBucket(lead.createdAt) }))
    .filter(({ bucket }) => bucket.key !== "undated")
    .sort((a, b) => a.bucket.sort - b.bucket.sort);

  const rows: ChartSliceDatum[] = [];
  const createdSoFar: Lead[] = [];
  for (const { lead, bucket } of dated) {
    createdSoFar.push(lead);
    const current = rows[rows.length - 1];
    if (current && current.key === bucket.key) {
      current.value = createdSoFar.length;
      current.leads = [...createdSoFar];
    } else {
      rows.push({
        key: bucket.key,
        label: bucket.label,
        sort: bucket.sort,
        value: createdSoFar.length,
        leads: [...createdSoFar],
      });
    }
  }
  return rows;
}

function buildFitScoreData(leads: Lead[]): ChartSliceDatum[] {
  const buckets: Record<string, { label: string; leads: Lead[] }> = {
    "0-24": { label: "0–24", leads: [] },
    "25-49": { label: "25–49", leads: [] },
    "50-74": { label: "50–74", leads: [] },
    "75-100": { label: "75–100", leads: [] },
  };

  for (const lead of leads) {
    const score = lead.fitScore;
    if (score < 25) buckets["0-24"].leads.push(lead);
    else if (score < 50) buckets["25-49"].leads.push(lead);
    else if (score < 75) buckets["50-74"].leads.push(lead);
    else buckets["75-100"].leads.push(lead);
  }

  return Object.entries(buckets).map(([key, bucket]) => ({
    key,
    label: bucket.label,
    value: bucket.leads.length,
    leads: bucket.leads,
  }));
}

function chartConfig(label: string): ChartConfig {
  return {
    value: { label, color: CHART_PRIMARY },
  };
}

const regulatoryChartConfig = {
  value: { label: "Leads" },
  permitted: { label: "Permitted", color: CHART_PRIMARY },
  restricted: { label: "Restricted", color: CHART_SECONDARY },
  prohibited: { label: "Prohibited", color: "var(--chart-3)" },
  unknown: { label: "Unknown", color: "var(--chart-4)" },
} satisfies ChartConfig;

function chartSliceDatumFromPayload(payload: unknown): ChartSliceDatum | null {
  const candidate =
    payload && typeof payload === "object" && "payload" in payload
      ? (payload as { payload?: unknown }).payload
      : payload;

  if (!candidate || typeof candidate !== "object") return null;
  if (!("leads" in candidate) || !Array.isArray(candidate.leads)) return null;
  return candidate as ChartSliceDatum;
}

function MetricCard({
  metric,
  value,
  onOpen,
}: {
  metric: SummaryMetric;
  value: number;
  onOpen: () => void;
}) {
  const trend = METRIC_TRENDS[metric.id] ?? { value: "Steady", tone: "muted" as const };

  return (
    <button
      type="button"
      className="flex min-w-0 flex-col items-start overflow-hidden rounded-xl border-[0.5px] border-border bg-background px-5 py-3 text-left transition-colors hover:bg-hover-overlay focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
      onClick={onOpen}
    >
      <p className="w-full truncate text-label-md text-tertiary-foreground">{metric.label}</p>
      <p className="mt-1 w-full truncate text-headline-lg text-inverse tabular-nums">{formatMetric(metric, value)}</p>
      <p className="mt-1 w-full truncate text-body-md text-muted-foreground">
        <span
          className={cn(
            trend.tone === "success" && "text-success",
            trend.tone === "warning" && "text-warning",
          )}
        >
          {trend.value}
        </span>
        {trend.suffix ? <span className="ml-1">{trend.suffix}</span> : null}
      </p>
    </button>
  );
}

function ChartCard({
  chart,
  leads,
  layout,
  onOpen,
}: {
  chart: DashboardChart;
  leads: Lead[];
  layout?: "wide";
  onOpen: (scope: { id: string; label: string; description: string; leads: Lead[] }) => void;
}) {
  const stageData = chart.kind === "stage" ? buildStageData(leads) : [];
  const regulatoryData = chart.kind === "regulatory" ? buildRegulatoryData(leads) : [];
  const lineData = chart.kind === "created" ? buildCreatedGrowthData(leads) : [];
  const fitScoreData = chart.kind === "fit_score" ? buildFitScoreData(leads) : [];
  const regulatoryTotal = regulatoryData.reduce((sum, row) => sum + row.value, 0);

  function openSlice(row: ChartSliceDatum) {
    if (row.leads.length === 0) return;
    onOpen({
      id: `${chart.id}:${row.key}`,
      label: row.label,
      description: `${row.label} leads.`,
      leads: row.leads,
    });
  }

  function openSliceFromPayload(payload: unknown) {
    const datum = chartSliceDatumFromPayload(payload);
    if (datum) openSlice(datum);
  }

  function openSliceFromKeyboard(event: KeyboardEvent<SVGElement>, row: ChartSliceDatum) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSlice(row);
    }
  }

  function renderTimelineDot(props: ActiveDotProps | DotItemDotProps) {
    const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: ChartSliceDatum };
    if (!payload || payload.leads.length === 0) return <circle cx={cx} cy={cy} r={0} />;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--color-value)"
        stroke="var(--background)"
        strokeWidth={2}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label={`Open ${payload.label} drilldown`}
        onClick={() => openSlice(payload)}
        onKeyDown={(event) => openSliceFromKeyboard(event, payload)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 overflow-hidden rounded-xl border-[0.5px] border-border bg-background px-5 py-4",
        layout === "wide" && "lg:col-span-2",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-label-md text-secondary-foreground">{chart.label}</p>
        <p className="text-body-sm text-muted-foreground">{chart.description}</p>
      </div>

      {chart.kind === "stage" || chart.kind === "fit_score" ? (
        <ChartContainer
          config={chartConfig("Leads")}
          className="aspect-auto h-[228px] w-full"
        >
          <BarChart data={chart.kind === "stage" ? stageData : fitScoreData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {(chart.kind === "stage" ? stageData : fitScoreData).map((row) => (
                <Cell
                  key={row.key}
                  cursor={row.leads.length > 0 ? "pointer" : "default"}
                  role={row.leads.length > 0 ? "button" : undefined}
                  tabIndex={row.leads.length > 0 ? 0 : undefined}
                  aria-label={row.leads.length > 0 ? `Open ${row.label} drilldown` : undefined}
                  onClick={(event: MouseEvent<SVGElement>) => {
                    event.stopPropagation();
                    openSlice(row);
                  }}
                  onKeyDown={(event: KeyboardEvent<SVGElement>) => openSliceFromKeyboard(event, row)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : null}

      {chart.kind === "created" ? (
        <ChartContainer
          config={chartConfig("Leads")}
          className="aspect-auto h-[228px] w-full"
        >
          <LineChart data={lineData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} />
            <YAxis hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={renderTimelineDot}
              activeDot={renderTimelineDot}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      ) : null}

      {chart.kind === "regulatory" ? (
        <div className="relative h-[206px] w-full">
          <ChartContainer config={regulatoryChartConfig} className="aspect-auto h-full w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key" />} />
              <Pie
                data={regulatoryData}
                dataKey="value"
                nameKey="key"
                innerRadius={54}
                outerRadius={78}
                paddingAngle={2}
                strokeWidth={4}
                isAnimationActive={false}
                onClick={openSliceFromPayload}
              >
                {regulatoryData.map((row) => (
                  <Cell
                    key={row.key}
                    fill={row.fill}
                    cursor={row.leads.length > 0 ? "pointer" : "default"}
                    role={row.leads.length > 0 ? "button" : undefined}
                    tabIndex={row.leads.length > 0 ? 0 : undefined}
                    aria-label={row.leads.length > 0 ? `Open ${row.label} drilldown` : undefined}
                    onClick={(event: MouseEvent<SVGElement>) => {
                      event.stopPropagation();
                      openSlice(row);
                    }}
                    onKeyDown={(event: KeyboardEvent<SVGElement>) => openSliceFromKeyboard(event, row)}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="key" />} />
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute left-1/2 top-[43%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-center">
            <span className="text-lg font-semibold leading-none text-foreground tabular-nums">{regulatoryTotal.toLocaleString()}</span>
            <span className="text-xs leading-none text-muted-foreground">Leads</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardOverview({ leads, onOpenDrilldown }: DashboardOverviewProps) {
  const lineCharts = DASHBOARD_CHARTS.filter((chart) => chart.kind === "created");
  const lowerCharts = DASHBOARD_CHARTS.filter((chart) => chart.kind !== "created");

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Lead metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_SUMMARIES.map((metric) => {
          const value = metricValue(metric, leads);
          return (
            <MetricCard
              key={metric.id}
              metric={metric}
              value={value}
              onOpen={() =>
                onOpenDrilldown({
                  id: `metric:${metric.id}`,
                  label: metric.label,
                  description: `Leads backing ${metric.label}.`,
                  leads,
                })
              }
            />
          );
        })}
      </section>

      <section aria-label="Lead charts" className="grid gap-4 lg:grid-cols-2">
        {lineCharts.map((chart) => (
          <ChartCard
            key={chart.id}
            chart={chart}
            leads={leads}
            layout="wide"
            onOpen={(scope) =>
              onOpenDrilldown({
                ...scope,
                description: `${scope.description} ${chart.description}`,
              })
            }
          />
        ))}
        {lowerCharts.map((chart) => (
          <ChartCard
            key={chart.id}
            chart={chart}
            leads={leads}
            onOpen={(scope) =>
              onOpenDrilldown({
                ...scope,
                description: `${scope.description} ${chart.description}`,
              })
            }
          />
        ))}
      </section>
    </div>
  );
}
