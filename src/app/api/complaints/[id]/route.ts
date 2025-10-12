import { NextResponse } from "next/server";
import { deleteComplaint } from "@/lib/dashboard-repository";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteComplaint(params.id);
    return NextResponse.json({ message: "Complaint archived" });
  } catch (error) {
    console.error("Failed to delete complaint", error);
    return NextResponse.json({ message: "Failed to delete complaint" }, { status: 500 });
  }
}
