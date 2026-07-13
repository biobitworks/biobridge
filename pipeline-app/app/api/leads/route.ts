import { NextResponse } from "next/server";
import { parsePaginationParams } from "@/lib/api/pagination";
import {
  listLeads,
  parseLeadListControls,
  toLeadListResponse,
} from "@/lib/leads/server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const pagination = parsePaginationParams(searchParams);
  if (!pagination) {
    return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
  }
  const controls = parseLeadListControls(searchParams);
  if (!controls) {
    return NextResponse.json({ error: "Invalid filters or sorts" }, { status: 400 });
  }

  const result = await listLeads(pagination, controls);
  return NextResponse.json(toLeadListResponse(result));
}
