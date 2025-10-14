import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/dashboard-repository";
import { createUserSession } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const email = typeof payload.email === "string" ? payload.email : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!email.trim() || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const userRecord = await findUserByEmail(email);
    if (!userRecord || !userRecord.passwordHash) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    await createUserSession(userRecord.id);

    return NextResponse.json({
      message: "Authenticated",
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        organization: userRecord.organization ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to authenticate user", error);
    return NextResponse.json({ message: "Failed to authenticate" }, { status: 500 });
  }
}
