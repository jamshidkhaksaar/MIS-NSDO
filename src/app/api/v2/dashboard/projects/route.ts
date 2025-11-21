import { NextResponse, type NextRequest } from "next/server";
import { fetchProjectsList } from "@/lib/api/dashboard-v2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const province = searchParams.get("province");

  const filters = {
      year: year ? parseInt(year) : undefined,
      province: province || undefined
  };

  try {
    const projects = await fetchProjectsList(filters);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to load projects list", error);
    return NextResponse.json(
      { message: "Failed to load projects list" },
      { status: 500 }
    );
  }
}
