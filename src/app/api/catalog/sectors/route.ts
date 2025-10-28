import { NextResponse } from "next/server";
import {
  fetchSectorCatalog,
  insertSectorCatalogEntry,
} from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireUserSession();
    const sectors = await fetchSectorCatalog();
    return NextResponse.json(sectors);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to load sector catalog", error);
    return NextResponse.json({ message: "Failed to load sector catalog" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    const entry = await insertSectorCatalogEntry({
      name: payload.name ?? "",
      description: payload.description,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "CatalogDuplicateError") {
      return NextResponse.json({ message: "A sector with this name already exists." }, { status: 409 });
    }
    console.error("Failed to store sector catalog entry", error);
    return NextResponse.json({ message: "Failed to store sector" }, { status: 500 });
  }
}
