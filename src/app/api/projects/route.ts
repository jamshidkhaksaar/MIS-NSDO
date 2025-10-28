import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Listing projects via API is not available yet." }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ message: "Creating projects via API is not available yet." }, { status: 501 });
}
