import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth-server";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: session.user,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to lookup session", error);
    return NextResponse.json({ message: "Failed to load session" }, { status: 500 });
  }
}
