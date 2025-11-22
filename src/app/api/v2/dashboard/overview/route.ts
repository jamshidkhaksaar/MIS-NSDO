import { NextResponse, type NextRequest } from "next/server";
import { fetchOverviewStats } from "@/lib/api/dashboard-v2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const province = searchParams.get("province");
  const sector = searchParams.get("sector");

  const filters = {
      year: year ? parseInt(year) : undefined,
      province: province || undefined,
      sector: sector || undefined
  };

  try {
    const stats = await fetchOverviewStats(filters);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to load dashboard overview stats", error);
    return NextResponse.json(
      { message: "Failed to load dashboard overview stats" },
      { status: 500 }
    );
  }
}
