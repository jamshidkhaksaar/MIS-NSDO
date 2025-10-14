import { NextResponse } from "next/server";
import { deleteComplaint } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUserSession();
    await deleteComplaint(params.id);
    return NextResponse.json({ message: "Complaint archived" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete complaint", error);
    return NextResponse.json({ message: "Failed to delete complaint" }, { status: 500 });
  }
}
