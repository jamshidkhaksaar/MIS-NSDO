import { NextResponse, type NextRequest } from "next/server";
import {
  deleteSectorCatalogEntry,
  updateSectorCatalogEntry,
} from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const { id } = await context.params;
    const entry = await updateSectorCatalogEntry({
      id,
      name: payload.name ?? "",
      description: payload.description,
    });
    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "CatalogDuplicateError") {
      return NextResponse.json({ message: "A sector with this name already exists." }, { status: 409 });
    }
    console.error("Failed to update sector catalog entry", error);
    return NextResponse.json({ message: "Failed to update sector" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUserSession();
    const { id } = await context.params;
    await deleteSectorCatalogEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete sector catalog entry", error);
    return NextResponse.json({ message: "Failed to delete sector" }, { status: 500 });
  }
}
