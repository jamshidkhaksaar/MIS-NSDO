import { NextResponse } from "next/server";
import { insertComplaint } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    await insertComplaint({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      village: payload.village,
      gender: payload.gender,
      source_of_complaint: payload.source_of_complaint,
      how_reported: payload.how_reported,
    });
    return NextResponse.json({ message: "Complaint recorded" }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to record complaint", error);
    return NextResponse.json({ message: "Failed to record complaint" }, { status: 500 });
  }
}
