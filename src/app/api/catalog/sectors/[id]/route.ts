import { NextResponse } from "next/server";
import {
  deleteSectorCatalogEntry,
  updateSectorCatalogEntry,
} from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const entry = await updateSectorCatalogEntry({
      id: params.id,
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

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireUserSession();
    await deleteSectorCatalogEntry(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete sector catalog entry", error);
    return NextResponse.json({ message: "Failed to delete sector" }, { status: 500 });
  }
}
