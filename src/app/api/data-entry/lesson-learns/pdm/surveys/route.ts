import { NextResponse } from "next/server";
import { createPdmSurvey } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createPdmSurvey({
      projectId: payload.projectId,
      tool: payload.tool,
      qualityScore: typeof payload.qualityScore === "number" ? payload.qualityScore : undefined,
      quantityScore: typeof payload.quantityScore === "number" ? payload.quantityScore : undefined,
      satisfactionScore: typeof payload.satisfactionScore === "number" ? payload.satisfactionScore : undefined,
      protectionScore: typeof payload.protectionScore === "number" ? payload.protectionScore : undefined,
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
        console.error("Failed to create PDM survey", error);
        return NextResponse.json({ message: "Failed to create PDM survey." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating PDM survey", error);
    return NextResponse.json({ message: "Failed to create PDM survey." }, { status: 500 });
  }
}
