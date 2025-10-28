import { NextResponse } from "next/server";
import { createEvaluation } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createEvaluation({
      projectId: payload.projectId ?? "",
      evaluationType: payload.evaluationType ?? "",
      evaluatorName: payload.evaluatorName,
      reportUrl: payload.reportUrl,
      findingsSummary: payload.findingsSummary,
      completedAt: payload.completedAt,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create evaluation record", error);
        return NextResponse.json({ message: "Failed to create evaluation record." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating evaluation record", error);
    return NextResponse.json({ message: "Failed to create evaluation record." }, { status: 500 });
  }
}
