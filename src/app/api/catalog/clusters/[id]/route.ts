import { NextResponse } from "next/server";
import {
  deleteClusterCatalogEntry,
  updateClusterCatalogEntry,
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
    const entry = await updateClusterCatalogEntry({
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
      return NextResponse.json({ message: "A cluster with this name already exists." }, { status: 409 });
    }
    console.error("Failed to update cluster catalog entry", error);
    return NextResponse.json({ message: "Failed to update cluster" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireUserSession();
    await deleteClusterCatalogEntry(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete cluster catalog entry", error);
    return NextResponse.json({ message: "Failed to delete cluster" }, { status: 500 });
  }
}
