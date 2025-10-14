import { NextResponse } from "next/server";
import { fetchDashboardState } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireUserSession();
    const state = await fetchDashboardState();
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to load dashboard state", error);
    return NextResponse.json({ message: "Failed to load dashboard state" }, { status: 500 });
  }
}
