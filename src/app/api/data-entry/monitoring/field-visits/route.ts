import { NextResponse } from "next/server";
import { createFieldVisit } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createFieldVisit({
      projectId: payload.projectId ?? "",
      visitDate: payload.visitDate ?? "",
      location: payload.location,
      positiveFindings: payload.positiveFindings,
      negativeFindings: payload.negativeFindings,
      photoUrl: payload.photoUrl,
      gpsCoordinates: payload.gpsCoordinates,
      officer: payload.officer,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create field visit record", error);
        return NextResponse.json({ message: "Failed to create field visit record." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating field visit record", error);
    return NextResponse.json({ message: "Failed to create field visit record." }, { status: 500 });
  }
}
