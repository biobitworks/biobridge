"use client";

import { useState } from "react";
import { DashboardOverview } from "@/components/dashboard-overview";
import { GraphScaleStats } from "@/components/graph-scale-stats";
import { LeadThreadAction } from "@/components/lead-thread-action";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Loading lead metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[118px] rounded-xl" />
        ))}
      </section>
      <section aria-label="Loading lead charts" className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="min-h-[300px] rounded-xl lg:col-span-2" />
        <Skeleton className="min-h-[286px] rounded-xl" />
        <Skeleton className="min-h-[286px] rounded-xl" />
        <Skeleton className="min-h-[286px] rounded-xl" />
      </section>
    </div>
  );
}

function DataError({ message }: { message: string }) {
  return (
    <Alert variant="danger">
      <AlertTitle>Unable to load dashboard</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export default function Home() {
  const [drilldownScope, setDrilldownScope] = useState<LeadDrilldownScope | null>(null);
  const leadsQuery = useLeads(500);
  const updateLeadField = useUpdateLeadField();

  if (leadsQuery.isPending) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        <DashboardSkeleton />
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

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4">
          <GraphScaleStats />
          <DashboardOverview
            leads={leadsQuery.leads}
            onOpenDrilldown={setDrilldownScope}
          />
        </div>
      </div>
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
