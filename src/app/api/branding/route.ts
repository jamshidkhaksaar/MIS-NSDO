import { NextResponse } from "next/server";
import { updateBranding } from "@/lib/dashboard-repository";

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    await updateBranding({
      companyName: payload.companyName,
      logoDataUrl: payload.logoDataUrl,
      faviconDataUrl: payload.faviconDataUrl,
    });
    return NextResponse.json({ message: "Branding updated" });
  } catch (error) {
    console.error("Failed to update branding", error);
    return NextResponse.json({ message: "Failed to update branding" }, { status: 500 });
  }
}
