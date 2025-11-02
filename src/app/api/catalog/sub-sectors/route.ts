import { NextResponse } from "next/server";
import { insertSubSector } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const entry = await insertSubSector({
      mainSectorId: payload.mainSectorId ?? "",
      name: payload.name ?? "",
      description: payload.description,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "CatalogDuplicateError") {
      return NextResponse.json({ message: "A sub-sector with this name already exists for the selected main sector." }, { status: 409 });
    }
    if (error instanceof Error) {
      const status = error.message.includes("required") ? 400 : 500;
      if (status === 500) {
        console.error("Failed to create sub-sector", error);
      }
      return NextResponse.json({ message: error.message }, { status });
    }
    console.error("Failed to create sub-sector", error);
    return NextResponse.json({ message: "Failed to create sub-sector." }, { status: 500 });
  }
}
