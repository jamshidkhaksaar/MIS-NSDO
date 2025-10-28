"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_BRANDING,
  DEFAULT_COMPLAINTS,
  type DashboardProject,
  type DashboardUser,
  type DashboardUserRole,
  type SectorDetails,
  type SectorKey,
  type SectorState,
  type BrandingSettings,
  type ComplaintRecord,
  type CatalogEntry,
  type ProjectDocumentRecord,
  type ProjectPhaseRecord,
  type MonitoringDashboardData,
  type EvaluationDashboardData,
  type ComplaintSummaryMetrics,
  type CrmAwarenessRecord,
  type FindingsDashboardData,
  type PdmDashboardData,
  type KnowledgeHubData,
  type UserAccessAssignmentRecord,
  type IntegrationRecord,
} from "@/lib/dashboard-data";
import { usePathname } from "next/navigation";

const DASHBOARD_STATE_ENDPOINT = "/api/dashboard/state";

type JsonFetchError = Error & { status?: number };

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      credentials: "include",
    });
  } catch (fetchError) {
    const error: JsonFetchError = new Error((fetchError as Error).message || "Network request failed");
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    const message = await response.text();
    const error: JsonFetchError = new Error(message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

function mergeCatalogEntry(list: CatalogEntry[], entry: CatalogEntry): CatalogEntry[] {
  const existingIndex = list.findIndex((item) => item.id === entry.id);
  if (existingIndex !== -1) {
    const next = [...list];
    next[existingIndex] = entry;
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...list, entry].sort((a, b) => a.name.localeCompare(b.name));
}

function removeCatalogEntry(list: CatalogEntry[], id: string): CatalogEntry[] {
  return list.filter((item) => item.id !== id);
}

type DashboardContextValue = {
  sectors: SectorState;
  reportingYears: number[];
  users: DashboardUser[];
  projects: DashboardProject[];
  projectDocuments: ProjectDocumentRecord[];
  projectPhases: ProjectPhaseRecord[];
  complaints: ComplaintRecord[];
  complaintMetrics: ComplaintSummaryMetrics;
  crmAwareness: CrmAwarenessRecord[];
  branding: BrandingSettings;
  clusterCatalog: CatalogEntry[];
  sectorCatalog: CatalogEntry[];
  monitoring: MonitoringDashboardData;
  evaluation: EvaluationDashboardData;
  findings: FindingsDashboardData;
  pdm: PdmDashboardData;
  knowledgeHub: KnowledgeHubData;
  userAccessAssignments: UserAccessAssignmentRecord[];
  integrations: IntegrationRecord[];
  refresh: () => Promise<void>;
  updateSector: (sector: SectorKey, details: SectorDetails) => Promise<void>;
  addReportingYear: (year: number) => Promise<void>;
  removeReportingYear: (year: number) => Promise<void>;
  addUser: (user: { name: string; email: string; role: DashboardUserRole; organization?: string; password?: string }) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateBranding: (payload: Partial<BrandingSettings>) => Promise<void>;
  addComplaint: (complaint: { fullName: string; email: string; phone?: string; message: string }) => Promise<void>;
  removeComplaint: (complaintId: string) => Promise<void>;
  registerCluster: (input: { name: string; description?: string }) => Promise<CatalogEntry>;
  registerSector: (input: { name: string; description?: string }) => Promise<CatalogEntry>;
  updateClusterCatalogEntry: (input: { id: string; name: string; description?: string }) => Promise<CatalogEntry>;
  updateSectorCatalogEntry: (input: { id: string; name: string; description?: string }) => Promise<CatalogEntry>;
  removeClusterCatalogEntry: (clusterId: string) => Promise<void>;
  removeSectorCatalogEntry: (sectorId: string) => Promise<void>;
  updateProject: (input: {
    id: string;
    code: string;
    name: string;
    sector?: string;
    donor?: string;
    country?: string;
    start?: string;
    end?: string;
    budget?: number | null;
    focalPoint?: string;
    goal?: string;
    objectives?: string;
    majorAchievements?: string;
    staff?: number | null;
    provinces?: string[];
    districts?: string[];
    communities?: string[];
    clusters?: string[];
    standardSectors?: string[];
  }) => Promise<void>;
  isLoading: boolean;
};

const DashboardDataContext = createContext<DashboardContextValue | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [sectors, setSectors] = useState<SectorState>({});
  const [reportingYears, setReportingYears] = useState<number[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocumentRecord[]>([]);
  const [projectPhases, setProjectPhases] = useState<ProjectPhaseRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(DEFAULT_COMPLAINTS);
  const [complaintMetrics, setComplaintMetrics] = useState<ComplaintSummaryMetrics>({
    total: 0,
    open: 0,
    inReview: 0,
    resolved: 0,
  });
  const [crmAwareness, setCrmAwareness] = useState<CrmAwarenessRecord[]>([]);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [clusterCatalog, setClusterCatalog] = useState<CatalogEntry[]>([]);
  const [sectorCatalog, setSectorCatalog] = useState<CatalogEntry[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringDashboardData>({
    baselineSurveys: [],
    enumerators: [],
    dataCollectionTasks: [],
    baselineReports: [],
    fieldVisits: [],
    monthlyReports: [],
  });
  const [evaluation, setEvaluation] = useState<EvaluationDashboardData>({
    evaluations: [],
    stories: [],
  });
  const [findings, setFindings] = useState<FindingsDashboardData>({
    findings: [],
    summary: {
      total: 0,
      byType: {
        negative: 0,
        positive: 0,
      },
      bySeverity: {
        minor: 0,
        major: 0,
        critical: 0,
      },
      byStatus: {
        pending: 0,
        in_progress: 0,
        solved: 0,
      },
      byDepartment: {},
    },
  });
  const [pdm, setPdm] = useState<PdmDashboardData>({
    distributions: [],
    surveys: [],
    reports: [],
  });
  const [knowledgeHub, setKnowledgeHub] = useState<KnowledgeHubData>({
    lessons: [],
    resources: [],
  });
  const [userAccessAssignments, setUserAccessAssignments] = useState<UserAccessAssignmentRecord[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const isPublicRoute = pathname === "/login";

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await jsonFetch<{
        sectors: SectorState;
        reportingYears: number[];
        users: DashboardUser[];
        projects: DashboardProject[];
        projectDocuments: ProjectDocumentRecord[];
        projectPhases: ProjectPhaseRecord[];
        branding: BrandingSettings;
        complaints: ComplaintRecord[];
        complaintMetrics: ComplaintSummaryMetrics;
        crmAwareness: CrmAwarenessRecord[];
        monitoring: MonitoringDashboardData;
        evaluation: EvaluationDashboardData;
        findings: FindingsDashboardData;
        pdm: PdmDashboardData;
        knowledgeHub: KnowledgeHubData;
        userAccessAssignments: UserAccessAssignmentRecord[];
        integrations: IntegrationRecord[];
        clusterCatalog: CatalogEntry[];
        sectorCatalog: CatalogEntry[];
      }>(DASHBOARD_STATE_ENDPOINT);

      setSectors(state.sectors);
      setReportingYears(state.reportingYears);
      setUsers(state.users);
      setProjects(state.projects);
      setProjectDocuments(state.projectDocuments);
      setProjectPhases(state.projectPhases);
      setBranding(state.branding);
      setComplaints(state.complaints);
      setComplaintMetrics(state.complaintMetrics);
      setCrmAwareness(state.crmAwareness);
      setClusterCatalog(state.clusterCatalog);
      setSectorCatalog(state.sectorCatalog);
      setMonitoring(state.monitoring);
      setEvaluation(state.evaluation);
      setFindings(state.findings);
      setPdm(state.pdm);
      setKnowledgeHub(state.knowledgeHub);
      setUserAccessAssignments(state.userAccessAssignments);
      setIntegrations(state.integrations);
    } catch (error) {
      const status = (error as JsonFetchError)?.status;
      if (status === 401) {
        setSectors({});
        setReportingYears([]);
        setUsers([]);
        setProjects([]);
        setProjectDocuments([]);
        setProjectPhases([]);
        setBranding(DEFAULT_BRANDING);
        setComplaints(DEFAULT_COMPLAINTS);
        setComplaintMetrics({
          total: 0,
          open: 0,
          inReview: 0,
          resolved: 0,
        });
        setCrmAwareness([]);
        setClusterCatalog([]);
        setSectorCatalog([]);
        setMonitoring({
          baselineSurveys: [],
          enumerators: [],
          dataCollectionTasks: [],
          baselineReports: [],
          fieldVisits: [],
          monthlyReports: [],
        });
        setEvaluation({
          evaluations: [],
          stories: [],
        });
        setFindings({
          findings: [],
          summary: {
            total: 0,
            byType: {
              negative: 0,
              positive: 0,
            },
            bySeverity: {
              minor: 0,
              major: 0,
              critical: 0,
            },
            byStatus: {
              pending: 0,
              in_progress: 0,
              solved: 0,
            },
            byDepartment: {},
          },
        });
        setPdm({
          distributions: [],
          surveys: [],
          reports: [],
        });
        setKnowledgeHub({
          lessons: [],
          resources: [],
        });
        setUserAccessAssignments([]);
        setIntegrations([]);
      } else if (status === 0) {
        console.warn("Network request to", DASHBOARD_STATE_ENDPOINT, "failed. Retaining existing state.");
      } else {
        console.error("Failed to refresh dashboard state", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPublicRoute) {
      setSectors({});
      setReportingYears([]);
      setUsers([]);
      setProjects([]);
      setProjectDocuments([]);
      setProjectPhases([]);
      setComplaints(DEFAULT_COMPLAINTS);
      setComplaintMetrics({
        total: 0,
        open: 0,
        inReview: 0,
        resolved: 0,
      });
      setCrmAwareness([]);
      setBranding(DEFAULT_BRANDING);
      setClusterCatalog([]);
      setSectorCatalog([]);
      setMonitoring({
        baselineSurveys: [],
        enumerators: [],
        dataCollectionTasks: [],
        baselineReports: [],
        fieldVisits: [],
        monthlyReports: [],
      });
      setEvaluation({
        evaluations: [],
        stories: [],
      });
      setFindings({
        findings: [],
        summary: {
          total: 0,
          byType: {
            negative: 0,
            positive: 0,
          },
          bySeverity: {
            minor: 0,
            major: 0,
            critical: 0,
          },
          byStatus: {
            pending: 0,
            in_progress: 0,
            solved: 0,
          },
          byDepartment: {},
        },
      });
      setPdm({
        distributions: [],
        surveys: [],
        reports: [],
      });
      setKnowledgeHub({
        lessons: [],
        resources: [],
      });
      setUserAccessAssignments([]);
      setIntegrations([]);
      setIsLoading(false);
      return;
    }
    refresh();
  }, [refresh, isPublicRoute]);

  const updateSector = useCallback(async (sector: SectorKey, details: SectorDetails) => {
    await jsonFetch(`/api/sectors/${encodeURIComponent(sector)}`, {
      method: "PUT",
      body: JSON.stringify(details),
    });
    await refresh();
  }, [refresh]);

  const addReportingYear = useCallback(async (year: number) => {
    await jsonFetch("/api/reporting-years", {
      method: "POST",
      body: JSON.stringify({ year }),
    });
    await refresh();
  }, [refresh]);

  const removeReportingYear = useCallback(async (year: number) => {
    await jsonFetch(`/api/reporting-years/${year}`, {
      method: "DELETE",
    });
    await refresh();
  }, [refresh]);

  const addUser = useCallback(async (user: { name: string; email: string; role: DashboardUserRole; organization?: string; password?: string }) => {
    await jsonFetch("/api/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
    await refresh();
  }, [refresh]);

  const removeUser = useCallback(async (userId: string) => {
    await jsonFetch(`/api/users/${userId}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const registerCluster = useCallback(async (input: { name: string; description?: string }) => {
    const entry = await jsonFetch<CatalogEntry>("/api/catalog/clusters", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setClusterCatalog((previous) => mergeCatalogEntry(previous, entry));
    return entry;
  }, []);

  const registerSector = useCallback(async (input: { name: string; description?: string }) => {
    const entry = await jsonFetch<CatalogEntry>("/api/catalog/sectors", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setSectorCatalog((previous) => mergeCatalogEntry(previous, entry));
    return entry;
  }, []);

  const updateClusterCatalogEntry = useCallback(async (input: { id: string; name: string; description?: string }) => {
    const entry = await jsonFetch<CatalogEntry>(`/api/catalog/clusters/${encodeURIComponent(input.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name: input.name, description: input.description }),
    });
    setClusterCatalog((previous) => mergeCatalogEntry(previous, entry));
    return entry;
  }, []);

  const removeClusterCatalogEntry = useCallback(async (clusterId: string) => {
    await jsonFetch(`/api/catalog/clusters/${encodeURIComponent(clusterId)}`, {
      method: "DELETE",
    });
    setClusterCatalog((previous) => removeCatalogEntry(previous, clusterId));
  }, []);

  const updateSectorCatalogEntry = useCallback(async (input: { id: string; name: string; description?: string }) => {
    const entry = await jsonFetch<CatalogEntry>(`/api/catalog/sectors/${encodeURIComponent(input.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name: input.name, description: input.description }),
    });
    setSectorCatalog((previous) => mergeCatalogEntry(previous, entry));
    return entry;
  }, []);

  const removeSectorCatalogEntry = useCallback(async (sectorId: string) => {
    await jsonFetch(`/api/catalog/sectors/${encodeURIComponent(sectorId)}`, {
      method: "DELETE",
    });
    setSectorCatalog((previous) => removeCatalogEntry(previous, sectorId));
  }, []);

  const updateBranding = useCallback(async (payload: Partial<BrandingSettings>) => {
    await jsonFetch("/api/branding", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await refresh();
  }, [refresh]);

  const addComplaint = useCallback(async (complaint: { fullName: string; email: string; phone?: string; message: string }) => {
    await jsonFetch("/api/complaints", {
      method: "POST",
      body: JSON.stringify(complaint),
    });
    await refresh();
  }, [refresh]);

  const removeComplaint = useCallback(async (complaintId: string) => {
    await jsonFetch(`/api/complaints/${complaintId}`, {
      method: "DELETE",
    });
    await refresh();
  }, [refresh]);

  const updateProject = useCallback(async (input: {
    id: string;
    code: string;
    name: string;
    sector?: string;
    donor?: string;
    country?: string;
    start?: string;
    end?: string;
    budget?: number | null;
    focalPoint?: string;
    goal?: string;
    objectives?: string;
    majorAchievements?: string;
    staff?: number | null;
    provinces?: string[];
    districts?: string[];
    communities?: string[];
    clusters?: string[];
    standardSectors?: string[];
  }) => {
    await jsonFetch(`/api/projects/${encodeURIComponent(input.id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    await refresh();
  }, [refresh]);

  const value = useMemo<DashboardContextValue>(() => ({
    sectors,
    reportingYears,
    users,
    projects,
    projectDocuments,
    projectPhases,
    complaints,
    complaintMetrics,
    crmAwareness,
    branding,
    clusterCatalog,
    sectorCatalog,
    monitoring,
    evaluation,
    findings,
    pdm,
    knowledgeHub,
    userAccessAssignments,
    integrations,
    refresh,
    updateSector,
    addReportingYear,
    removeReportingYear,
    addUser,
    removeUser,
    updateBranding,
    addComplaint,
    removeComplaint,
    registerCluster,
    registerSector,
    updateClusterCatalogEntry,
    updateSectorCatalogEntry,
    removeClusterCatalogEntry,
    removeSectorCatalogEntry,
    updateProject,
    isLoading,
  }), [
    sectors,
    reportingYears,
    users,
    projects,
    projectDocuments,
    projectPhases,
    complaints,
    complaintMetrics,
    crmAwareness,
    branding,
    clusterCatalog,
    sectorCatalog,
    monitoring,
    evaluation,
    findings,
    pdm,
    knowledgeHub,
    userAccessAssignments,
    integrations,
    refresh,
    updateSector,
    addReportingYear,
    removeReportingYear,
    addUser,
    removeUser,
    updateBranding,
    addComplaint,
    removeComplaint,
    registerCluster,
    registerSector,
    updateClusterCatalogEntry,
    updateSectorCatalogEntry,
    removeClusterCatalogEntry,
    removeSectorCatalogEntry,
    updateProject,
    isLoading,
  ]);

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error("useDashboardData must be used within a DashboardDataProvider");
  }
  return context;
}
