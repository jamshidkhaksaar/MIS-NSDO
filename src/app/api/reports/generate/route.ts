import { NextResponse, type NextRequest } from "next/server";
import { fetchDashboardState } from "@/lib/dashboard-repository";
import { buildDashboardReport, type ReportFilters } from "@/lib/report-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const filters: ReportFilters = {
      years: Array.isArray(body.years)
        ? body.years
            .map((value: unknown) => {
              const numeric = Number(value);
              return Number.isFinite(numeric) ? numeric : undefined;
            })
            .filter((value: number | undefined): value is number => typeof value === "number")
        : undefined,
      projectIds: Array.isArray(body.projectIds) ? body.projectIds.filter((value: unknown) => typeof value === "string") : undefined,
      provinces: Array.isArray(body.provinces) ? body.provinces.filter((value: unknown) => typeof value === "string") : undefined,
      sectors: Array.isArray(body.sectors) ? body.sectors.filter((value: unknown) => typeof value === "string") : undefined,
      clusters: Array.isArray(body.clusters) ? body.clusters.filter((value: unknown) => typeof value === "string") : undefined,
    };

    const state = await fetchDashboardState();
    const pdfBuffer = await buildDashboardReport(state, filters);
    const uint8View = Uint8Array.from(pdfBuffer);
    const blob = new Blob([uint8View], { type: "application/pdf" });
    const fileName = `nsdo-dashboard-report-${Date.now()}.pdf`;

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate dashboard report", error);
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 });
  }
}
