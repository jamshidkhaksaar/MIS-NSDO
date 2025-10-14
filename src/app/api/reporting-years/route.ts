import { NextResponse } from "next/server";
import { insertReportingYear } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const year = Number(payload.year);
    if (!Number.isFinite(year)) {
      return NextResponse.json({ message: "Invalid year" }, { status: 400 });
    }
    await insertReportingYear(Math.floor(year));
    return NextResponse.json({ message: "Year added" }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to add reporting year", error);
    return NextResponse.json({ message: "Failed to add reporting year" }, { status: 500 });
  }
}
