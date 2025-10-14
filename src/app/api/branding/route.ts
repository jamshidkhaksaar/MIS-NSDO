import { NextResponse } from "next/server";
import { updateBranding } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function PATCH(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    await updateBranding({
      companyName: payload.companyName,
      logoDataUrl: payload.logoDataUrl,
      faviconDataUrl: payload.faviconDataUrl,
    });
    return NextResponse.json({ message: "Branding updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to update branding", error);
    return NextResponse.json({ message: "Failed to update branding" }, { status: 500 });
  }
}
