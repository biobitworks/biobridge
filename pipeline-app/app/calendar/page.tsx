"use client";

import { useState } from "react";
import {
  LeadStageFilter,
  type LeadStageFilterValue,
} from "@/components/lead-stage-filter";
import { LeadThreadAction } from "@/components/lead-thread-action";
import { ViewToggle } from "@/components/view-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarView, type CalendarEvent } from "@/components/ui/calendar-view";
import type { DataValue } from "@/components/ui/data-types";
import { DrilldownDialog } from "@/components/ui/drilldown-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads, useUpdateLeadField } from "@/lib/leads/client";
import {
  leadColumns,
  leadDetailFields,
  leadRowsScope,
  leadValues,
} from "@/lib/leads/table-config";
import type { Lead, LeadDrilldownScope } from "@/lib/leads/types";

function CalendarSkeleton() {
  return <Skeleton className="min-h-[520px] rounded-md" />;
}

function DataError({ message }: { message: string }) {
  return (
    <Alert variant="danger">
      <AlertTitle>Unable to load calendar</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export default function CalendarPage() {
  const [drilldownScope, setDrilldownScope] = useState<LeadDrilldownScope | null>(null);
  const [stageFilter, setStageFilter] = useState<LeadStageFilterValue>("all");
  const stage = stageFilter === "all" ? undefined : stageFilter;
  const leadsQuery = useLeads(500, { stage });
  const updateLeadField = useUpdateLeadField();
  const leads = leadsQuery.leads;

  if (leadsQuery.isPending) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        <CalendarSkeleton />
      </div>
    );
  }

  if (leadsQuery.isError) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        <DataError message={leadsQuery.error instanceof Error ? leadsQuery.error.message : "The leads request failed."} />
      </div>
    );
  }

  const events: CalendarEvent<Lead>[] = leads.map((lead) => ({
    id: lead.id,
    title: lead.orgName,
    date: lead.createdAt ?? null,
    data: lead,
  }));

  return (
    <>
      <CalendarView
        label="Lead calendar"
        events={events}
        headerStart={
          <div className="flex flex-wrap items-center gap-3">
            <LeadStageFilter value={stageFilter} onValueChange={setStageFilter} />
            <ViewToggle active="calendar" />
          </div>
        }
        onEventClick={(event) =>
          setDrilldownScope({
            id: `calendar:${event.id}`,
            label: "Calendar",
            description: "Leads created on the selected date.",
            leads: event.data ? [event.data] : [],
            lead: event.data,
            leadOnly: true,
          })
        }
      />
      <DrilldownDialog
        columns={leadColumns}
        detailFields={leadDetailFields}
        scope={leadRowsScope(drilldownScope)}
        open={drilldownScope != null}
        onOpenChange={(open) => !open && setDrilldownScope(null)}
        titleColumnKey="orgName"
        initialRow={drilldownScope?.lead ?? null}
        initialRowOnly={drilldownScope?.leadOnly}
        getRowId={(lead) => lead.id}
        getRowTitle={(lead) => lead.orgName}
        getRowValues={leadValues}
        onCellCommit={(lead: Lead, field, value: DataValue) =>
          updateLeadField.mutateAsync({
            leadId: lead.id,
            fieldKey: field.key,
            value,
          })
        }
        renderDetailActions={(lead) => <LeadThreadAction lead={lead} />}
        emptyTitle="No leads"
        emptyDescription="There are no leads in this drilldown."
        detailDescription="Lead details"
      />
    </>
  );
}
