import { NextResponse, type NextRequest } from "next/server";
import { fetchOverviewStats } from "@/lib/api/dashboard-v2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const province = searchParams.get("province");

  const filters = {
      year: year ? parseInt(year) : undefined,
      province: province || undefined
  };

  try {
    // Re-using fetchOverviewStats as it already groups by sector
    const stats = await fetchOverviewStats(filters);
    // Transform to array list for the table
    const sectorsList = Object.entries(stats.sectors)
        .filter(([key]) => key !== "All Sectors")
        .map(([key, details]) => ({
            name: key,
            ...details
        }));

    return NextResponse.json(sectorsList);
  } catch (error) {
    console.error("Failed to load sectors list", error);
    return NextResponse.json(
      { message: "Failed to load sectors list" },
      { status: 500 }
    );
  }
}
