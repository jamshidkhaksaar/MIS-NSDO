import { NextResponse } from "next/server";
import { deleteProject, updateProject } from "@/lib/dashboard-repository";
import { requireUserSession, UnauthorizedError } from "@/lib/auth-server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUserSession();
    const payload = await request.json();
    await updateProject(params.id, {
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
    return NextResponse.json({ message: "Project updated" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to update project", error);
    return NextResponse.json({ message: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUserSession();
    await deleteProject(params.id);
    return NextResponse.json({ message: "Project removed" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to delete project", error);
    return NextResponse.json({ message: "Failed to delete project" }, { status: 500 });
  }
}
