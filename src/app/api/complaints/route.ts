import { NextResponse } from "next/server";
import { insertComplaint } from "@/lib/dashboard-repository";
import { getUserSession } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const session = await getUserSession();
    const isAnonymous = Boolean(payload.isAnonymous);
    const fullName = typeof payload.fullName === "string" ? payload.fullName : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const phone = typeof payload.phone === "string" ? payload.phone : undefined;
    const message = typeof payload.message === "string" ? payload.message : "";
    const village = typeof payload.village === "string" ? payload.village : undefined;
    const gender = typeof payload.gender === "string" ? payload.gender : undefined;
    const sourceOfComplaint =
      typeof payload.source_of_complaint === "string" ? payload.source_of_complaint : undefined;
    const howReported = typeof payload.how_reported === "string" ? payload.how_reported : undefined;

    if (!session && !isAnonymous) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!message.trim()) {
      return NextResponse.json({ message: "Complaint message is required" }, { status: 400 });
    }

    await insertComplaint({
      fullName,
      email,
      phone,
      message,
      village,
      gender,
      source_of_complaint: sourceOfComplaint,
      how_reported: howReported,
      isAnonymous,
    });
    return NextResponse.json({ message: "Complaint recorded" }, { status: 201 });
  } catch (error) {
    console.error("Failed to record complaint", error);
    return NextResponse.json({ message: "Failed to record complaint" }, { status: 500 });
  }
}
