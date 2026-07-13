"use client";

import { LeadBoard } from "@/components/lead-board";
import { CustodyPanel } from "@/components/custody-panel";
import { ViewToggle } from "@/components/view-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLeads } from "@/lib/leads/client";

export default function BoardPage() {
  const leadsQuery = useLeads(500);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-4 lg:px-6">
        <CustodyPanel />
      </div>
      <div className="flex shrink-0 items-center justify-end px-4 pt-3 lg:px-6">
        <ViewToggle active="board" />
      </div>
      {leadsQuery.isPending ? (
        <div className="flex gap-3 overflow-x-auto px-4 py-4 lg:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-lg" />
          ))}
        </div>
      ) : leadsQuery.isError ? (
        <div className="px-4 py-4 lg:px-6">
          <Alert variant="danger">
            <AlertTitle>Unable to load board</AlertTitle>
            <AlertDescription>
              {leadsQuery.error instanceof Error ? leadsQuery.error.message : "The leads request failed."}
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col pt-4">
          <LeadBoard leads={leadsQuery.leads} />
        </div>
      )}
    </div>
  );
}
