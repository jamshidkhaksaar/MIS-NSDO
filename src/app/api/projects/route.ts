import { NextResponse } from "next/server";
import { insertProject } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireUserSession();
    const payload = await request.json();
    await insertProject({
      name: payload.name,
      sectorKey: payload.sector,
      country: payload.country,
      goal: payload.goal ?? "",
      objectives: payload.objectives ?? "",
      majorAchievements: payload.majorAchievements ?? "",
      start: payload.start ?? "",
      end: payload.end ?? "",
      staff: Number(payload.staff) || 0,
      beneficiaries: payload.beneficiaries,
      provinces: payload.provinces ?? [],
      districts: payload.districts ?? [],
      communities: payload.communities ?? [],
      clusters: payload.clusters ?? [],
      standardSectors: payload.standardSectors ?? [],
    });
    return NextResponse.json({ message: "Project created" }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to create project", error);
    return NextResponse.json({ message: "Failed to create project" }, { status: 500 });
  }
}
