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
  ALL_SECTOR_KEY,
  ALL_SECTOR_FIELD_ACTIVITY,
  DEFAULT_BRANDING,
  DEFAULT_COMPLAINTS,
  PROJECT_SECTORS,
  RESPONSE_CLUSTERS,
  STANDARD_SECTOR_GROUPS,
  type DashboardProject,
  type DashboardUser,
  type DashboardUserRole,
  type SectorDetails,
  type SectorKey,
  type SectorState,
  type BrandingSettings,
  type ComplaintRecord,
} from "@/lib/dashboard-data";

const DASHBOARD_STATE_ENDPOINT = "/api/dashboard/state";

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json() as Promise<T>;
}

type DashboardContextValue = {
  sectors: SectorState;
  reportingYears: number[];
  users: DashboardUser[];
  projects: DashboardProject[];
  complaints: ComplaintRecord[];
  branding: BrandingSettings;
  refresh: () => Promise<void>;
  updateSector: (sector: SectorKey, details: SectorDetails) => Promise<void>;
  addReportingYear: (year: number) => Promise<void>;
  removeReportingYear: (year: number) => Promise<void>;
  addUser: (user: { name: string; email: string; role: DashboardUserRole; organization?: string }) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  addProject: (project: Omit<DashboardProject, "id">) => Promise<void>;
  updateProject: (projectId: string, updates: Omit<DashboardProject, "id">) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  updateBranding: (payload: Partial<BrandingSettings>) => Promise<void>;
  addComplaint: (complaint: { fullName: string; email: string; phone?: string; message: string }) => Promise<void>;
  removeComplaint: (complaintId: string) => Promise<void>;
  isLoading: boolean;
};

const DashboardDataContext = createContext<DashboardContextValue | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [sectors, setSectors] = useState<SectorState>({});
  const [reportingYears, setReportingYears] = useState<number[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(DEFAULT_COMPLAINTS);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await jsonFetch<{
        sectors: SectorState;
        reportingYears: number[];
        users: DashboardUser[];
        projects: DashboardProject[];
        branding: BrandingSettings;
        complaints: ComplaintRecord[];
      }>(DASHBOARD_STATE_ENDPOINT);

      setSectors(state.sectors);
      setReportingYears(state.reportingYears);
      setUsers(state.users);
      setProjects(state.projects);
      setBranding(state.branding);
      setComplaints(state.complaints);
    } catch (error) {
      console.error("Failed to refresh dashboard state", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  const addUser = useCallback(async (user: { name: string; email: string; role: DashboardUserRole; organization?: string }) => {
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

  const addProject = useCallback(async (project: Omit<DashboardProject, "id">) => {
    await jsonFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify(project),
    });
    await refresh();
  }, [refresh]);

  const updateProject = useCallback(async (projectId: string, updates: Omit<DashboardProject, "id">) => {
    await jsonFetch(`/api/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    await refresh();
  }, [refresh]);

  const removeProject = useCallback(async (projectId: string) => {
    await jsonFetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    await refresh();
  }, [refresh]);

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

  const value = useMemo<DashboardContextValue>(() => ({
    sectors,
    reportingYears,
    users,
    projects,
    complaints,
    branding,
    refresh,
    updateSector,
    addReportingYear,
    removeReportingYear,
    addUser,
    removeUser,
    addProject,
    updateProject,
    removeProject,
    updateBranding,
    addComplaint,
    removeComplaint,
    isLoading,
  }), [
    sectors,
    reportingYears,
    users,
    projects,
    complaints,
    branding,
    refresh,
    updateSector,
    addReportingYear,
    removeReportingYear,
    addUser,
    removeUser,
    addProject,
    updateProject,
    removeProject,
    updateBranding,
    addComplaint,
    removeComplaint,
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

export {
  ALL_SECTOR_KEY,
  ALL_SECTOR_FIELD_ACTIVITY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  BENEFICIARY_GROUPS,
  PROJECT_SECTORS,
  RESPONSE_CLUSTERS,
  STANDARD_SECTOR_GROUPS,
};
