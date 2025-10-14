import { NextResponse } from "next/server";
import { upsertSectorDetails } from "@/lib/dashboard-repository";
import type { SectorDetails } from "@/lib/dashboard-data";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function PUT(
  request: Request,
  { params }: { params: { sectorKey: string } }
) {
  try {
    await requireUserSession();
    const payload = (await request.json()) as SectorDetails;
    await upsertSectorDetails(params.sectorKey, payload);
    return NextResponse.json({ message: "Sector updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to update sector", error);
    return NextResponse.json({ message: "Failed to update sector" }, { status: 500 });
  }
}
