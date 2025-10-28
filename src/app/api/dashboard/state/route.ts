import { NextResponse } from "next/server";
import { fetchDashboardState } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function GET() {
  let isAuthenticated = true;
  try {
    await requireUserSession();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      isAuthenticated = false;
    } else {
      console.error("Failed to verify session before loading dashboard state", error);
      return NextResponse.json({ message: "Failed to verify session" }, { status: 500 });
    }
  }

  try {
    const state = await fetchDashboardState();
    if (isAuthenticated) {
      return NextResponse.json(state);
    }

    const sanitized = {
      ...state,
      users: [],
      complaints: [],
      complaintMetrics: state.complaintMetrics,
      crmAwareness: [],
      userAccessAssignments: [],
      integrations: [],
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Failed to load dashboard state", error);
    return NextResponse.json({ message: "Failed to load dashboard state" }, { status: 500 });
  }
}
