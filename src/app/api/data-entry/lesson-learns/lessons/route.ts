import { NextResponse } from "next/server";
import { createLesson } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createLesson({
      projectId: payload.projectId,
      source: payload.source,
      lesson: payload.lesson ?? "",
      department: payload.department,
      theme: payload.theme,
      capturedAt: payload.capturedAt,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create lesson record", error);
        return NextResponse.json({ message: "Failed to create lesson record." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating lesson record", error);
    return NextResponse.json({ message: "Failed to create lesson record." }, { status: 500 });
  }
}
