import { NextResponse } from "next/server";
import { fetchAvailableFilters } from "@/lib/api/dashboard-v2";

export async function GET() {
  try {
    const filters = await fetchAvailableFilters();
    return NextResponse.json(filters);
  } catch (error) {
    console.error("Failed to load dashboard filters", error);
    return NextResponse.json(
      { message: "Failed to load dashboard filters" },
      { status: 500 }
    );
  }
}
