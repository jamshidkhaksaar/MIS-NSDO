import { NextResponse } from "next/server";
import { insertReportingYear } from "@/lib/dashboard-repository";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const year = Number(payload.year);
    if (!Number.isFinite(year)) {
      return NextResponse.json({ message: "Invalid year" }, { status: 400 });
    }
    await insertReportingYear(Math.floor(year));
    return NextResponse.json({ message: "Year added" }, { status: 201 });
  } catch (error) {
    console.error("Failed to add reporting year", error);
    return NextResponse.json({ message: "Failed to add reporting year" }, { status: 500 });
  }
}
