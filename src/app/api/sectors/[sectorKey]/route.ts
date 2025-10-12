import { NextResponse } from "next/server";
import { upsertSectorDetails } from "@/lib/dashboard-repository";
import type { SectorDetails } from "@/lib/dashboard-data";

export async function PUT(
  request: Request,
  { params }: { params: { sectorKey: string } }
) {
  try {
    const payload = (await request.json()) as SectorDetails;
    await upsertSectorDetails(params.sectorKey, payload);
    return NextResponse.json({ message: "Sector updated" });
  } catch (error) {
    console.error("Failed to update sector", error);
    return NextResponse.json({ message: "Failed to update sector" }, { status: 500 });
  }
}
