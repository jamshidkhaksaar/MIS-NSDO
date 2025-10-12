import { NextResponse } from "next/server";
import { removeUserById } from "@/lib/dashboard-repository";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await removeUserById(params.id);
    return NextResponse.json({ message: "User removed" });
  } catch (error) {
    console.error("Failed to remove user", error);
    return NextResponse.json({ message: "Failed to remove user" }, { status: 500 });
  }
}
