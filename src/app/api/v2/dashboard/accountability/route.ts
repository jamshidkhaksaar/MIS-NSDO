import { NextResponse, type NextRequest } from "next/server";
import { fetchAccountabilityOverview } from "@/lib/api/dashboard-v2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const province = searchParams.get("province");
  const sector = searchParams.get("sector");

  try {
    const data = await fetchAccountabilityOverview({
      year: year ? parseInt(year) : undefined,
      province: province || undefined,
      sector: sector || undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load accountability overview", error);
    return NextResponse.json(
      { message: "Failed to load accountability overview" },
      { status: 500 }
    );
  }
}
