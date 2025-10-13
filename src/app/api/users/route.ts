import { NextResponse } from "next/server";
import { insertUser } from "@/lib/dashboard-repository";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
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
    console.error("Failed to save user", error);
    return NextResponse.json({ message: "Failed to save user" }, { status: 500 });
  }
}
