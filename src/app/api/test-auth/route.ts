
import { NextResponse } from "next/server";
import { createUserSession } from "@/lib/auth-server";
import { findUserByEmail } from "@/lib/dashboard-repository";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const user = await findUserByEmail("admin@example.org");
  if (!user) {
    return NextResponse.json({ message: "Default admin user not found. Did you seed the database?" }, { status: 500 });
  }

  await createUserSession(user.id);
  return NextResponse.json({ message: "Session created" });
}
