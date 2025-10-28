import { NextResponse } from "next/server";
import { createMonthlyReport } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createMonthlyReport({
      projectId: payload.projectId ?? "",
      reportMonth: payload.reportMonth ?? "",
      summary: payload.summary,
      gaps: payload.gaps,
      recommendations: payload.recommendations,
      status: payload.status,
      reviewer: payload.reviewer,
      feedback: payload.feedback,
      submittedAt: payload.submittedAt,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create monthly report", error);
        return NextResponse.json({ message: "Failed to create monthly report." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating monthly report", error);
    return NextResponse.json({ message: "Failed to create monthly report." }, { status: 500 });
  }
}
