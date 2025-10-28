import { NextResponse } from "next/server";
import { createPdmReport } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createPdmReport({
      projectId: payload.projectId,
      reportDate: payload.reportDate,
      summary: payload.summary,
      recommendations: payload.recommendations,
      feedbackToProgram: payload.feedbackToProgram,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create PDM report", error);
        return NextResponse.json({ message: "Failed to create PDM report." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating PDM report", error);
    return NextResponse.json({ message: "Failed to create PDM report." }, { status: 500 });
  }
}
