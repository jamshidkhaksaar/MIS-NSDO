import { NextResponse } from "next/server";
import { insertComplaint } from "@/lib/dashboard-repository";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await insertComplaint({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
    });
    return NextResponse.json({ message: "Complaint recorded" }, { status: 201 });
  } catch (error) {
    console.error("Failed to record complaint", error);
    return NextResponse.json({ message: "Failed to record complaint" }, { status: 500 });
  }
}
