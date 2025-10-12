import { NextResponse } from "next/server";
import { insertUser } from "@/lib/dashboard-repository";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await insertUser({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      organization: payload.organization,
    });
    return NextResponse.json({ message: "User saved" }, { status: 201 });
  } catch (error) {
    console.error("Failed to save user", error);
    return NextResponse.json({ message: "Failed to save user" }, { status: 500 });
  }
}
