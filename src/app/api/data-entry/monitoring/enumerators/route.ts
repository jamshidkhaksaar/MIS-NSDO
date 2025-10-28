import { NextResponse } from "next/server";
import { createEnumerator } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const record = await createEnumerator({
      fullName: payload.fullName ?? "",
      email: payload.email,
      phone: payload.phone,
      province: payload.province,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const isServerIssue = error.message.startsWith("Failed");
      if (isServerIssue) {
        console.error("Failed to create enumerator", error);
        return NextResponse.json({ message: "Failed to create enumerator." }, { status: 500 });
      }
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Unexpected error creating enumerator", error);
    return NextResponse.json({ message: "Failed to create enumerator." }, { status: 500 });
  }
}
