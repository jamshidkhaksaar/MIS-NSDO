import { NextResponse } from "next/server";
import { fetchDashboardState } from "@/lib/dashboard-repository";

export async function GET() {
  try {
    const state = await fetchDashboardState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to load dashboard state", error);
    return NextResponse.json({ message: "Failed to load dashboard state" }, { status: 500 });
  }
}
