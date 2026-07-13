"use client";

import { ListTree } from "lucide-react";
import { useKylonWorkspaceContext } from "@/components/providers/kylon-workspace-provider";
import { Button } from "@/components/ui/button";
import { openKylonUrl } from "@/lib/kylon/bridge";
import { leadThreadHref } from "@/lib/leads/client";
import type { Lead } from "@/lib/leads/types";

export function LeadThreadAction({ lead }: { lead: Lead }) {
  const kylonWorkspace = useKylonWorkspaceContext();
  if (!kylonWorkspace) return null;
  const href = leadThreadHref(kylonWorkspace, lead.id);

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        if (!openKylonUrl(href)) window.location.assign(href);
      }}
    >
      <ListTree className="icon-14" />
      Discuss in thread
    </Button>
  );
}
