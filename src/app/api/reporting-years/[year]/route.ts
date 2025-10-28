import { NextResponse, type NextRequest } from "next/server";
import { deleteReportingYear } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ year: string }> }
) {
  try {
    await requireUserSession();
    const { year: yearParam } = await context.params;
    const year = Number(yearParam);
    if (!Number.isFinite(year)) {
      return NextResponse.json({ message: "Invalid year" }, { status: 400 });
    }
    await deleteReportingYear(Math.floor(year));
    return NextResponse.json({ message: "Year removed" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to remove reporting year", error);
    return NextResponse.json({ message: "Failed to remove reporting year" }, { status: 500 });
  }
}
