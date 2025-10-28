import PDFDocument from "pdfkit";
import {
  BENEFICIARY_TYPE_KEYS,
  type BeneficiaryBreakdown,
  type DashboardProject,
  type MonitoringDashboardData,
  type EvaluationDashboardData,
  type FindingsDashboardData,
  type PdmDashboardData,
  type BrandingSettings,
} from "@/lib/dashboard-data";

export type ReportFilters = {
  years?: number[];
  projectIds?: string[];
  provinces?: string[];
  sectors?: string[];
  clusters?: string[];
};

type DashboardState = Awaited<ReturnType<typeof import("@/lib/dashboard-repository").fetchDashboardState>>;

type PdfDoc = InstanceType<typeof PDFDocument>;

type ReportData = {
  projects: DashboardProject[];
  monitoring: MonitoringDashboardData;
  evaluation: EvaluationDashboardData;
  findings: FindingsDashboardData;
  pdm: PdmDashboardData;
  beneficiaries: BeneficiaryBreakdown;
  provinces: string[];
  sectors: Set<string>;
  clusters: Set<string>;
};

function dataUrlToBuffer(dataUrl: string | null | undefined): Buffer | null {
  if (!dataUrl) {
    return null;
  }
  const matches = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!matches) {
    return null;
  }
  const [, , base64Data] = matches;
  return Buffer.from(base64Data, "base64");
}

function createEmptyBreakdown(): BeneficiaryBreakdown {
  const direct: BeneficiaryBreakdown["direct"] = {} as BeneficiaryBreakdown["direct"];
  const indirect: BeneficiaryBreakdown["indirect"] = {} as BeneficiaryBreakdown["indirect"];
  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    direct[key] = 0;
    indirect[key] = 0;
  });
  return { direct, indirect };
}

function filterProjects(projects: DashboardProject[], filters: ReportFilters): DashboardProject[] {
  return projects.filter((project) => {
    if (filters.projectIds?.length && !filters.projectIds.includes(project.id)) {
      return false;
    }
    if (filters.sectors?.length && project.sector) {
      const sectorMatch = filters.sectors.some((sector) => project.sector?.toLowerCase() === sector.toLowerCase());
      if (!sectorMatch) {
        return false;
      }
    }
    if (filters.clusters?.length) {
      const match = project.clusters.some((cluster) =>
        filters.clusters?.some((filterCluster) => cluster.toLowerCase() === filterCluster.toLowerCase())
      );
      if (!match) {
        return false;
      }
    }
    if (filters.provinces?.length) {
      const match = project.provinces.some((province) =>
        filters.provinces?.some((filterProvince) => province.toLowerCase() === filterProvince.toLowerCase())
      );
      if (!match) {
        return false;
      }
    }
    if (filters.years?.length) {
      const startYear = project.start ? Number.parseInt(project.start.slice(0, 4), 10) : undefined;
      const endYear = project.end ? Number.parseInt(project.end.slice(0, 4), 10) : undefined;
      const matchesYear = filters.years.some((year) => {
        if (startYear && endYear) {
          return year >= startYear && year <= endYear;
        }
        if (startYear) {
          return year === startYear;
        }
        return true;
      });
      if (!matchesYear) {
        return false;
      }
    }
    return true;
  });
}

function aggregateBeneficiaries(projects: DashboardProject[]): BeneficiaryBreakdown {
  const total = createEmptyBreakdown();
  projects.forEach((project) => {
    BENEFICIARY_TYPE_KEYS.forEach((type) => {
      total.direct[type] += project.beneficiaries.direct[type] ?? 0;
      total.indirect[type] += project.beneficiaries.indirect[type] ?? 0;
    });
  });
  return total;
}

function filterMonitoring(data: MonitoringDashboardData, allowedProjects: Set<string>): MonitoringDashboardData {
  return {
    baselineSurveys: data.baselineSurveys.filter((item) => allowedProjects.has(item.projectId)),
    enumerators: data.enumerators,
    dataCollectionTasks: data.dataCollectionTasks.filter((item) => !item.baselineSurveyId || allowedProjects.has(item.baselineSurveyId)),
    baselineReports: data.baselineReports.filter((item) => allowedProjects.has(item.baselineSurveyId)),
    fieldVisits: data.fieldVisits.filter((item) => allowedProjects.has(item.projectId)),
    monthlyReports: data.monthlyReports.filter((item) => allowedProjects.has(item.projectId)),
  };
}

function filterEvaluation(data: EvaluationDashboardData, allowedProjects: Set<string>): EvaluationDashboardData {
  return {
    evaluations: data.evaluations.filter((item) => !item.projectId || allowedProjects.has(item.projectId)),
    stories: data.stories.filter((item) => !item.projectId || allowedProjects.has(item.projectId)),
  };
}

function filterFindings(data: FindingsDashboardData, allowedProjects: Set<string>): FindingsDashboardData {
  const findings = data.findings.filter((item) => !item.projectId || allowedProjects.has(item.projectId));
  return {
    findings,
    summary: data.summary,
  };
}

function filterPdm(data: PdmDashboardData, allowedProjects: Set<string>): PdmDashboardData {
  return {
    distributions: data.distributions.filter((item) => !item.projectId || allowedProjects.has(item.projectId)),
    surveys: data.surveys.filter((item) => !item.projectId || allowedProjects.has(item.projectId)),
    reports: data.reports.filter((item) => !item.projectId || allowedProjects.has(item.projectId)),
  };
}

function prepareReportData(state: DashboardState, filters: ReportFilters): ReportData {
  const filteredProjects = filterProjects(state.projects, filters);
  const allowedProjectIds = new Set(filteredProjects.map((project) => project.id));

  const beneficiaries = aggregateBeneficiaries(filteredProjects);
  const provinces = Array.from(new Set(filteredProjects.flatMap((project) => project.provinces))).sort((a, b) =>
    a.localeCompare(b)
  );
  const sectors = new Set<string>();
  filteredProjects.forEach((project) => {
    if (project.sector) {
      sectors.add(project.sector);
    }
  });
  const clusters = new Set<string>();
  filteredProjects.forEach((project) => {
    project.clusters.forEach((cluster) => clusters.add(cluster));
  });

  return {
    projects: filteredProjects,
    monitoring: filterMonitoring(state.monitoring, allowedProjectIds),
    evaluation: filterEvaluation(state.evaluation, allowedProjectIds),
    findings: filterFindings(state.findings, allowedProjectIds),
    pdm: filterPdm(state.pdm, allowedProjectIds),
    beneficiaries,
    provinces,
    sectors,
    clusters,
  };
}

function drawHeader(doc: PdfDoc, branding: BrandingSettings | null, pageNumber: number, totalPages?: number) {
  const { companyName, logoDataUrl } = branding ?? {};
  const logoBuffer = dataUrlToBuffer(logoDataUrl);

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, doc.page.margins.left, doc.page.margins.top - 30, { fit: [80, 40] });
    } catch {
      // ignore invalid logo data
    }
  }

  doc.font("Helvetica-Bold").fontSize(16).text(companyName || "NSDO", logoBuffer ? 110 : doc.page.margins.left, doc.page.margins.top - 20, {
    align: "left",
  });

  doc.font("Helvetica").fontSize(9).fillColor("#555555").text(new Date().toLocaleString(), doc.page.width - doc.page.margins.right - 150, doc.page.margins.top - 30, {
    width: 150,
    align: "right",
  });

  doc.moveTo(doc.page.margins.left, doc.page.margins.top - 5)
    .lineTo(doc.page.width - doc.page.margins.right, doc.page.margins.top - 5)
    .strokeColor("#CCCCCC")
    .stroke();

  doc.fontSize(9).fillColor("#555555").text(`Page ${pageNumber}${totalPages ? ` of ${totalPages}` : ""}`, doc.page.margins.left, doc.page.height - doc.page.margins.bottom + 15, {
    align: "center",
  });

  doc.fillColor("#111111");
}

function addSectionTitle(doc: PdfDoc, title: string, subtitle?: string) {
  doc.moveDown(1.5);
  doc.font("Helvetica-Bold").fontSize(14).text(title);
  if (subtitle) {
    doc.font("Helvetica").fontSize(10).fillColor("#555555").text(subtitle);
    doc.fillColor("#111111");
  }
  doc.moveDown(0.5);
  doc.moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#DDDDDD")
    .stroke();
  doc.moveDown(0.5);
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString() : "0";
}

function drawKeyValue(doc: PdfDoc, label: string, value: string) {
  doc.font("Helvetica-Bold").fontSize(10).text(label);
  doc.font("Helvetica").fontSize(10).text(value);
  doc.moveDown(0.3);
}

function drawBeneficiaryChart(doc: PdfDoc, beneficiaries: BeneficiaryBreakdown) {
  const chartX = doc.x;
  const chartY = doc.y;
  const chartWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const barHeight = 14;
  const gap = 6;

  let maxValue = 0;
  BENEFICIARY_TYPE_KEYS.forEach((type) => {
    maxValue = Math.max(maxValue, beneficiaries.direct[type], beneficiaries.indirect[type]);
  });
  if (maxValue === 0) {
    doc.fontSize(10).fillColor("#555555").text("No beneficiary data available.", chartX, chartY);
    doc.fillColor("#111111");
    doc.moveDown();
    return;
  }

  let currentY = chartY;
  BENEFICIARY_TYPE_KEYS.forEach((type) => {
    const directValue = beneficiaries.direct[type];
    const indirectValue = beneficiaries.indirect[type];

    doc.fontSize(9).fillColor("#333333").text(type, chartX, currentY);
    const labelWidth = doc.widthOfString(type) + 10;
    const barMaxWidth = chartWidth - labelWidth - 80;

    const directWidth = (directValue / maxValue) * barMaxWidth;
    const indirectWidth = (indirectValue / maxValue) * barMaxWidth;

    doc.rect(chartX + labelWidth, currentY - 2, directWidth, barHeight).fill("#2f855a");
    doc.rect(chartX + labelWidth + directWidth + 4, currentY - 2, indirectWidth, barHeight).fill("#2b6cb0");

    doc.fillColor("#000000")
      .fontSize(8)
      .text(formatNumber(directValue), chartX + labelWidth + directWidth + 6, currentY);
    doc.text(formatNumber(indirectValue), chartX + labelWidth + directWidth + indirectWidth + 12, currentY);
    doc.fillColor("#111111");

    currentY += barHeight + gap;
  });

  doc.moveDown(beneficiaries ? 1.2 : 0.5);
}

function drawProjectsTable(doc: PdfDoc, projects: DashboardProject[]) {
  const startX = doc.page.margins.left;
  const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const headers = ["Code", "Project name", "Sector", "Donor", "Provinces"];
  const columnWidths = [60, availableWidth * 0.3, availableWidth * 0.2, availableWidth * 0.2, availableWidth * 0.25];

  doc.font("Helvetica-Bold").fontSize(10);
  headers.forEach((header, index) => {
    const x = startX + columnWidths.slice(0, index).reduce((acc, value) => acc + value, 0);
    doc.text(header, x, doc.y, { width: columnWidths[index], continued: index !== headers.length - 1 });
  });
  doc.text("", startX, doc.y);
  doc.moveDown(0.3);

  doc.moveTo(startX, doc.y).lineTo(startX + availableWidth, doc.y).strokeColor("#DDDDDD").stroke();
  doc.moveDown(0.2);

  doc.font("Helvetica").fontSize(9);
  projects.forEach((project) => {
    const provinces = project.provinces.slice(0, 3).join(", ") + (project.provinces.length > 3 ? "…" : "");
    const values = [
      project.code,
      project.name,
      project.sector || "—",
      project.donor || "—",
      provinces || "—",
    ];

    values.forEach((value, index) => {
      const x = startX + columnWidths.slice(0, index).reduce((acc, item) => acc + item, 0);
      doc.text(value, x, doc.y, {
        width: columnWidths[index],
        continued: index !== values.length - 1,
      });
    });
    doc.text("", startX, doc.y);
    doc.moveDown(0.3);
  });
  doc.moveDown();
}

function addMonitoringSection(doc: PdfDoc, data: MonitoringDashboardData) {
  const baselineCompleted = data.baselineSurveys.filter((survey) => survey.status === "completed").length;
  const monthlyApproved = data.monthlyReports.filter((report) => report.status === "approved").length;

  drawKeyValue(doc, "Baseline surveys", `${baselineCompleted} completed / ${data.baselineSurveys.length} total`);
  drawKeyValue(doc, "Monthly narratives", `${monthlyApproved} approved / ${data.monthlyReports.length} total`);
  drawKeyValue(doc, "Field visits logged", `${data.fieldVisits.length}`);
  drawKeyValue(doc, "Enumerators on roster", `${data.enumerators.length}`);
}

function addEvaluationSection(doc: PdfDoc, data: EvaluationDashboardData) {
  if (!data.evaluations.length && !data.stories.length) {
    doc.fontSize(9).fillColor("#555555").text("No evaluation records available for the selected filters.");
    doc.fillColor("#111111");
    doc.moveDown();
    return;
  }

  const evaluationsByType = data.evaluations.reduce<Record<string, number>>((acc, item) => {
    acc[item.evaluationType] = (acc[item.evaluationType] ?? 0) + 1;
    return acc;
  }, {});

  Object.entries(evaluationsByType).forEach(([type, count]) => {
    drawKeyValue(doc, `${type} evaluations`, String(count));
  });
  drawKeyValue(doc, "Stories collected", String(data.stories.length));
}

function addFindingsSection(doc: PdfDoc, data: FindingsDashboardData) {
  if (!data.findings.length) {
    doc.fontSize(9).fillColor("#555555").text("No findings captured for the selected filters.");
    doc.fillColor("#111111");
    doc.moveDown();
    return;
  }

  const byStatus = data.findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.status] = (acc[finding.status] ?? 0) + 1;
    return acc;
  }, {});

  Object.entries(byStatus).forEach(([status, count]) => {
    drawKeyValue(doc, `Findings ${status.replace(/_/g, " ")}`, String(count));
  });
}

function addPdmSection(doc: PdfDoc, data: PdmDashboardData) {
  drawKeyValue(doc, "Distributions recorded", String(data.distributions.length));
  drawKeyValue(doc, "PDM surveys completed", String(data.surveys.length));
  drawKeyValue(doc, "PDM reports filed", String(data.reports.length));
}

function applyFiltersSummary(doc: PdfDoc, filters: ReportFilters) {
  doc.fontSize(10);
  doc.font("Helvetica-Bold").text("Scope & filters", { underline: true });
  doc.moveDown(0.5);
  doc.font("Helvetica");

  const lines: string[] = [];
  if (filters.years?.length) {
    lines.push(`Years: ${filters.years.join(", ")}`);
  }
  if (filters.projectIds?.length) {
    lines.push(`Projects: ${filters.projectIds.length} selected`);
  }
  if (filters.provinces?.length) {
    lines.push(`Provinces: ${filters.provinces.join(", ")}`);
  }
  if (filters.sectors?.length) {
    lines.push(`Sectors: ${filters.sectors.join(", ")}`);
  }
  if (filters.clusters?.length) {
    lines.push(`Clusters: ${filters.clusters.join(", ")}`);
  }

  if (!lines.length) {
    lines.push("Filters: none (full portfolio report)");
  }

  lines.forEach((line) => doc.text(line));
  doc.moveDown();
}

export async function buildDashboardReport(state: DashboardState, filters: ReportFilters): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 70, bottom: 60, left: 50, right: 50 },
      info: {
        Title: "NSDO Dashboard Report",
        Author: "NSDO MIS",
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", (error: unknown) => reject(error));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    let pageNumber = 1;
    drawHeader(doc, state.branding, pageNumber);

    doc.font("Helvetica-Bold").fontSize(20).text("MIS Programme Report", { align: "center" });
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(12).text("NSDO Monitoring, Evaluation, Accountability & Learning", { align: "center" });
    doc.moveDown(1);

    applyFiltersSummary(doc, filters);

    const reportData = prepareReportData(state, filters);
    addSectionTitle(doc, "Portfolio overview", `${reportData.projects.length} project(s) included`);

    drawKeyValue(doc, "Total beneficiaries (direct)", formatNumber(
      BENEFICIARY_TYPE_KEYS.reduce((acc, key) => acc + reportData.beneficiaries.direct[key], 0)
    ));
    drawKeyValue(doc, "Total beneficiaries (indirect)", formatNumber(
      BENEFICIARY_TYPE_KEYS.reduce((acc, key) => acc + reportData.beneficiaries.indirect[key], 0)
    ));
    drawKeyValue(doc, "Provinces covered", reportData.provinces.length ? reportData.provinces.join(", ") : "—");
    drawKeyValue(doc, "Sectors involved", reportData.sectors.size ? Array.from(reportData.sectors).join(", ") : "—");
    drawKeyValue(doc, "Clusters engaged", reportData.clusters.size ? Array.from(reportData.clusters).join(", ") : "—");

    doc.moveDown();
    addSectionTitle(doc, "Beneficiary reach");
    drawBeneficiaryChart(doc, reportData.beneficiaries);

    addSectionTitle(doc, "Project portfolio");
    if (reportData.projects.length) {
      drawProjectsTable(doc, reportData.projects.slice(0, 15));
      if (reportData.projects.length > 15) {
        doc.fontSize(9).fillColor("#777777").text(`+ ${reportData.projects.length - 15} additional projects not shown`);
        doc.fillColor("#111111");
        doc.moveDown();
      }
    } else {
      doc.fontSize(10).fillColor("#555555").text("No projects match the selected filters.");
      doc.fillColor("#111111");
      doc.moveDown();
    }

    addSectionTitle(doc, "Monitoring highlights");
    addMonitoringSection(doc, reportData.monitoring);

    doc.addPage();
    pageNumber += 1;
    drawHeader(doc, state.branding, pageNumber);

    addSectionTitle(doc, "Evaluation & learning");
    addEvaluationSection(doc, reportData.evaluation);

    addSectionTitle(doc, "Accountability & findings");
    addFindingsSection(doc, reportData.findings);

    addSectionTitle(doc, "Post-distribution monitoring");
    addPdmSection(doc, reportData.pdm);

    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fontSize(12).text("Narrative summary");
    doc.font("Helvetica").fontSize(10).fillColor("#333333").text(
      "This report consolidates monitoring, evaluation, accountability, and learning indicators across the selected programme scope. It is intended for donor engagement, internal oversight, and strategic planning. Data reflects the current MIS snapshot at the time of report generation."
    );

    doc.fillColor("#111111");
    doc.end();
  });
}
