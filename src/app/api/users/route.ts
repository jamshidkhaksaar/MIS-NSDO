import { NextResponse } from "next/server";
import { insertUser } from "@/lib/dashboard-repository";
import bcrypt from "bcryptjs";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const passwordHash = payload.password
      ? await bcrypt.hash(String(payload.password), 10)
      : undefined;
    await insertUser({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      organization: payload.organization,
      passwordHash,
    });
    return NextResponse.json({ message: "User saved" }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to save user", error);
    return NextResponse.json({ message: "Failed to save user" }, { status: 500 });
  }
}
