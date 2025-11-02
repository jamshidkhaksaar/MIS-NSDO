import { NextResponse, type NextRequest } from "next/server";
import { deleteSubSector, updateSubSector } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const { id } = await context.params;
    const entry = await updateSubSector({
      id,
      mainSectorId: payload.mainSectorId ?? "",
      name: payload.name ?? "",
      description: payload.description,
    });
    return NextResponse.json(entry);
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
        console.error("Failed to update sub-sector", error);
      }
      return NextResponse.json({ message: error.message }, { status });
    }
    console.error("Failed to update sub-sector", error);
    return NextResponse.json({ message: "Failed to update sub-sector." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUserSession();
    const { id } = await context.params;
    await deleteSubSector(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete sub-sector", error);
    return NextResponse.json({ message: "Failed to delete sub-sector." }, { status: 500 });
  }
}
