import { NextResponse } from "next/server";
import { removeUserById } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUserSession();
    await removeUserById(params.id);
    return NextResponse.json({ message: "User removed" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to remove user", error);
    return NextResponse.json({ message: "Failed to remove user" }, { status: 500 });
  }
}
