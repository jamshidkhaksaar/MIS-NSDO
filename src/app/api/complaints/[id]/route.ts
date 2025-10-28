import { NextResponse, type NextRequest } from "next/server";
import { deleteComplaint } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserSession();
    const { id } = await context.params;
    await deleteComplaint(id);
    return NextResponse.json({ message: "Complaint archived" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete complaint", error);
    return NextResponse.json({ message: "Failed to delete complaint" }, { status: 500 });
  }
}
