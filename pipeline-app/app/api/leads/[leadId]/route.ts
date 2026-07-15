import { NextResponse } from "next/server";
import { isExampleMode } from "@/lib/mode";
import {
  deleteLead,
  getLead,
  leadEntityId,
  toLeadResponse,
  updateLead,
} from "@/lib/leads/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await context.params;
  const lead = await getLead(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(toLeadResponse(lead));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await context.params;
  if (isExampleMode()) {
    return NextResponse.json(
      { error: "BioBridge is a frozen example. Edits are disabled — nothing is persisted." },
      { status: 405 },
    );
  }
  const body = (await request.json().catch(() => null)) as { data?: unknown } | null;
  if (!body || typeof body.data !== "object" || body.data == null || Array.isArray(body.data)) {
    return NextResponse.json({ error: "Expected request body with object data." }, { status: 400 });
  }

  const lead = await updateLead(leadId, body.data as Record<string, unknown>);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(toLeadResponse(lead));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await context.params;
  if (isExampleMode()) {
    return NextResponse.json(
      { error: "BioBridge is a frozen example. Edits are disabled — nothing is persisted." },
      { status: 405 },
    );
  }
  const deleted = await deleteLead(leadId);
  if (!deleted) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({
    entity_id: leadEntityId,
    record_id: leadId,
    deleted: true,
  });
}
