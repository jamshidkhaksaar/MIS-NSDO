import { NextResponse, type NextRequest } from "next/server";
import { createProjectRecord } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

const sanitizeArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length);
  return items.length ? items : undefined;
};

export async function GET() {
  return NextResponse.json({ message: "Listing projects via API is not available yet." }, { status: 501 });
}

export async function POST(request: NextRequest) {
  try {
    await requireUserSession();
    const payload = await request.json();

    const result = await createProjectRecord({
      code: typeof payload.code === "string" ? payload.code : "",
      name: typeof payload.name === "string" ? payload.name : "",
      sector: typeof payload.sector === "string" ? payload.sector : undefined,
      donor: typeof payload.donor === "string" ? payload.donor : undefined,
      country: typeof payload.country === "string" ? payload.country : undefined,
      start: typeof payload.start === "string" ? payload.start : undefined,
      end: typeof payload.end === "string" ? payload.end : undefined,
      budget: typeof payload.budget === "number" ? payload.budget : undefined,
      focalPoint: typeof payload.focalPoint === "string" ? payload.focalPoint : undefined,
      goal: typeof payload.goal === "string" ? payload.goal : undefined,
      objectives: typeof payload.objectives === "string" ? payload.objectives : undefined,
      majorAchievements:
        typeof payload.majorAchievements === "string" ? payload.majorAchievements : undefined,
      staff: typeof payload.staff === "number" ? payload.staff : undefined,
      provinces: sanitizeArray(payload.provinces),
      districts: sanitizeArray(payload.districts),
      communities: sanitizeArray(payload.communities),
      clusters: sanitizeArray(payload.clusters),
      standardSectors: sanitizeArray(payload.standardSectors),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const status = /required/i.test(error.message) ? 400 : 500;
      if (status === 500) {
        console.error("Failed to create project", error);
      }
      return NextResponse.json({ message: error.message }, { status });
    }
    console.error("Unexpected error creating project", error);
    return NextResponse.json({ message: "Failed to create project." }, { status: 500 });
  }
}
