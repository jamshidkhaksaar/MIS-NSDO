import { NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/auth-server";

export async function POST() {
  try {
    await destroyUserSession();
    return NextResponse.json({ message: "Signed out" });
  } catch (error) {
    console.error("Failed to destroy session", error);
    return NextResponse.json({ message: "Failed to logout" }, { status: 500 });
  }
}
