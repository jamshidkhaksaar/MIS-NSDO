import { NextResponse } from "next/server";
import { createCrmAwarenessRecord } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createCrmAwarenessRecord({
      projectId: payload.projectId,
      district: payload.district,
      awarenessDate: payload.awarenessDate,
      notes: payload.notes,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create CRM awareness record", error);
        return NextResponse.json({ message: "Failed to create CRM awareness record." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating CRM awareness record", error);
    return NextResponse.json({ message: "Failed to create CRM awareness record." }, { status: 500 });
  }
}
