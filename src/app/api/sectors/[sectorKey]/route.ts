import { NextResponse, type NextRequest } from "next/server";
import { upsertSectorDetails } from "@/lib/dashboard-repository";
import type { SectorDetails } from "@/lib/dashboard-data";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sectorKey: string }> }
) {
  try {
    await requireUserSession();
    const payload = (await request.json()) as SectorDetails;
    const { sectorKey } = await context.params;
    await upsertSectorDetails(sectorKey, payload);
    return NextResponse.json({ message: "Sector updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to update sector", error);
    return NextResponse.json({ message: "Failed to update sector" }, { status: 500 });
  }
}
