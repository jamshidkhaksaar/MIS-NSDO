import { NextResponse } from "next/server";
import { createBaselineSurvey } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createBaselineSurvey({
      projectId: payload.projectId ?? "",
      title: payload.title ?? "",
      tool: payload.tool,
      status: payload.status,
      questionnaireUrl: payload.questionnaireUrl,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create baseline survey", error);
        return NextResponse.json({ message: "Failed to create baseline survey." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating baseline survey", error);
    return NextResponse.json({ message: "Failed to create baseline survey." }, { status: 500 });
  }
}
