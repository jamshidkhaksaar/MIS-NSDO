import { NextResponse } from "next/server";
import { deleteReportingYear } from "@/lib/dashboard-repository";

export async function DELETE(
  _request: Request,
  { params }: { params: { year: string } }
) {
  try {
    const year = Number(params.year);
    if (!Number.isFinite(year)) {
      return NextResponse.json({ message: "Invalid year" }, { status: 400 });
    }
    await deleteReportingYear(Math.floor(year));
    return NextResponse.json({ message: "Year removed" });
  } catch (error) {
    console.error("Failed to remove reporting year", error);
    return NextResponse.json({ message: "Failed to remove reporting year" }, { status: 500 });
  }
}
