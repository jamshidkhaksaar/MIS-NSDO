import { NextResponse } from "next/server";
import { createDistributionRecord } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createDistributionRecord({
      projectId: payload.projectId,
      assistanceType: payload.assistanceType ?? "",
      distributionDate: payload.distributionDate,
      location: payload.location,
      targetBeneficiaries: typeof payload.targetBeneficiaries === "number" ? payload.targetBeneficiaries : undefined,
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
        console.error("Failed to create distribution record", error);
        return NextResponse.json({ message: "Failed to create distribution record." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating distribution record", error);
    return NextResponse.json({ message: "Failed to create distribution record." }, { status: 500 });
  }
}
