import { NextResponse, type NextRequest } from "next/server";
import { fetchMonitoringOverview } from "@/lib/api/dashboard-v2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const province = searchParams.get("province");
  const sector = searchParams.get("sector");

  try {
    const data = await fetchMonitoringOverview({
      year: year ? parseInt(year) : undefined,
      province: province || undefined,
      sector: sector || undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load monitoring overview", error);
    return NextResponse.json(
      { message: "Failed to load monitoring overview" },
      { status: 500 }
    );
  }
}
