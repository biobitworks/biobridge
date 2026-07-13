'use client';

import { ListTree, Maximize2, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  LeadStageFilter,
  type LeadStageFilterValue,
} from '@/components/lead-stage-filter';
import { LeadThreadAction } from '@/components/lead-thread-action';
import { CustodyPanel } from '@/components/custody-panel';
import { ViewToggle } from '@/components/view-toggle';
import { useKylonWorkspaceContext } from '@/components/providers/kylon-workspace-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableTitleAction } from '@/components/ui/data-table';
import type { DataValue } from '@/components/ui/data-types';
import { DrilldownDialog } from '@/components/ui/drilldown-dialog';
import { openKylonUrl } from '@/lib/kylon/bridge';
import {
  leadThreadHref,
  useDeleteLead,
  useInfiniteLeads,
  useUpdateLeadField,
} from '@/lib/leads/client';
import {
  leadColumns,
  leadDetailFields,
  leadRowsScope,
  leadValues,
} from '@/lib/leads/table-config';
import type { Lead, LeadDrilldownScope } from '@/lib/leads/types';

function DataError({ message }: { message: string }) {
  return (
    <Alert variant="danger">
      <AlertTitle>Unable to load leads</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export default function LeadsPage() {
  const [drilldownScope, setDrilldownScope] = useState<LeadDrilldownScope | null>(null);
  const [leadPendingDelete, setLeadPendingDelete] = useState<Lead | null>(null);
  const [stageFilter, setStageFilter] = useState<LeadStageFilterValue>('all');
  const kylonWorkspace = useKylonWorkspaceContext();
  const stage = stageFilter === 'all' ? undefined : stageFilter;
  const { leads, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, error } =
    useInfiniteLeads(undefined, { stage });
  const updateLeadField = useUpdateLeadField();
  const deleteLead = useDeleteLead();

  const openLeadDetails = useCallback(
    (lead: Lead) => {
      setDrilldownScope({
        id: `lead:${lead.id}`,
        label: 'Leads',
        description: 'Lead detail.',
        leads,
        lead,
        leadOnly: true,
      });
    },
    [leads]
  );
  const openLeadThread = useCallback(
    (lead: Lead) => {
      if (!kylonWorkspace) return;
      const href = leadThreadHref(kylonWorkspace, lead.id);
      if (!openKylonUrl(href)) window.location.assign(href);
    },
    [kylonWorkspace]
  );
  const loadMoreLeads = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const requestDeleteLead = useCallback((lead: Lead) => {
    setLeadPendingDelete(lead);
  }, []);
  const confirmDeleteLead = useCallback(() => {
    if (!leadPendingDelete) return;
    const leadId = leadPendingDelete.id;
    setLeadPendingDelete(null);
    setDrilldownScope((scope) => (scope?.lead?.id === leadId ? null : scope));
    deleteLead.mutate({ leadId });
  }, [deleteLead, leadPendingDelete]);
  const commitLeadField = useCallback(
    (lead: Lead, field: { key: string }, value: DataValue) =>
      updateLeadField.mutateAsync({
        leadId: lead.id,
        fieldKey: field.key,
        value,
      }),
    [updateLeadField]
  );
  const titleActions = useMemo<DataTableTitleAction<Lead>[]>(
    () => [
      ...(kylonWorkspace
        ? [
            {
              key: 'thread',
              icon: <ListTree />,
              label: 'Discuss in thread',
              ariaLabel: (lead: Lead) => `Discuss ${lead.orgName} in thread`,
              tooltip: 'Discuss in thread',
              onClick: openLeadThread,
            },
          ]
        : []),
      {
        key: 'dialog',
        icon: <Maximize2 />,
        label: 'Open in dialog',
        ariaLabel: (lead: Lead) => `Open ${lead.orgName} in dialog`,
        tooltip: 'Open in dialog',
        onClick: openLeadDetails,
      },
    ],
    [kylonWorkspace, openLeadDetails, openLeadThread]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-4 lg:px-6">
        <CustodyPanel />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 overflow-x-auto px-4 py-4 lg:px-6">
        <LeadStageFilter value={stageFilter} onValueChange={setStageFilter} />
        <ViewToggle active="table" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {isError ? (
          <div className="px-4 lg:px-6">
            <DataError message={error instanceof Error ? error.message : 'The leads request failed.'} />
          </div>
        ) : null}
        <DataTable
          className="min-h-0 flex-1 px-4 lg:px-6 lg:pb-4"
          columns={leadColumns}
          rows={leads}
          titleColumnKey="orgName"
          getRowId={(lead) => lead.id}
          getRowTitle={(lead) => lead.orgName}
          loading={isPending && leads.length === 0}
          hasMoreRows={hasNextPage}
          loadingMore={isFetchingNextPage}
          onLoadMoreRows={loadMoreLeads}
          onRowActivate={openLeadDetails}
          onCellCommit={commitLeadField}
          rowAriaLabel={(lead) => `Open details for ${lead.orgName}`}
          titleActions={titleActions}
          emptyTitle="No leads"
          emptyDescription={
            stageFilter === 'all'
              ? 'No leads have been added yet.'
              : 'No leads match this stage filter.'
          }
        />
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
        onCellCommit={commitLeadField}
        renderDetailActions={(lead) => (
          <>
            <LeadThreadAction lead={lead} />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => requestDeleteLead(lead)}
            >
              <Trash2 className="icon-14" />
              Delete
            </Button>
          </>
        )}
        emptyTitle="No leads"
        emptyDescription="There are no leads in this drilldown."
        detailDescription="Lead details"
      />
      <AlertDialog
        open={leadPendingDelete != null}
        onOpenChange={(open) => !open && setLeadPendingDelete(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes "{leadPendingDelete?.orgName}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteLead}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
