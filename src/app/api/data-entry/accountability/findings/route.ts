import { NextResponse } from "next/server";
import { createFinding } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createFinding({
      projectId: payload.projectId,
      findingType: payload.findingType ?? "",
      category: payload.category,
      severity: payload.severity ?? "",
      department: payload.department,
      status: payload.status ?? "",
      description: payload.description,
      evidenceUrl: payload.evidenceUrl,
      reminderDueAt: payload.reminderDueAt,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create finding record", error);
        return NextResponse.json({ message: "Failed to create finding record." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating finding record", error);
    return NextResponse.json({ message: "Failed to create finding record." }, { status: 500 });
  }
}
