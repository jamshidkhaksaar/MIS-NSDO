import { NextResponse } from "next/server";
import { updateProjectRecord } from "@/lib/dashboard-repository";
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

    const parseOptionalNumber = (value: unknown): number | null | undefined => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
      throw new Error("Numeric fields must contain valid numbers.");
    };

    await updateProjectRecord({
      id: params.id,
      code: payload.code ?? "",
      name: payload.name ?? "",
      sector: payload.sector,
      donor: payload.donor,
      country: payload.country,
      start: payload.start,
      end: payload.end,
      budget: parseOptionalNumber(payload.budget) ?? null,
      focalPoint: payload.focalPoint,
      goal: payload.goal,
      objectives: payload.objectives,
      majorAchievements: payload.majorAchievements,
      staff: parseOptionalNumber(payload.staff) ?? null,
      provinces: Array.isArray(payload.provinces) ? payload.provinces : undefined,
      districts: Array.isArray(payload.districts) ? payload.districts : undefined,
      communities: Array.isArray(payload.communities) ? payload.communities : undefined,
      clusters: Array.isArray(payload.clusters) ? payload.clusters : undefined,
      standardSectors: Array.isArray(payload.standardSectors) ? payload.standardSectors : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error) {
      const status = /required|must contain/.test(error.message) ? 400 : 500;
      if (status === 500) {
        console.error("Failed to update project", error);
        return NextResponse.json({ message: "Failed to update project." }, { status });
      }
      return NextResponse.json({ message: error.message }, { status });
    }
    console.error("Unexpected error updating project", error);
    return NextResponse.json({ message: "Failed to update project." }, { status: 500 });
  }
}
