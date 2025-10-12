"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ALL_SECTOR_KEY,
  ALL_SECTOR_FIELD_ACTIVITY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  BENEFICIARY_GROUPS,
  INITIAL_REPORTING_YEARS,
  INITIAL_SECTOR_STATE,
  INITIAL_PROJECTS,
  INITIAL_USERS,
  PROJECT_SECTORS,
  RESPONSE_CLUSTERS,
  STANDARD_SECTOR_GROUPS,
  DEFAULT_BRANDING,
  DEFAULT_COMPLAINTS,
} from "@/lib/dashboard-data";
import type {
  BeneficiaryBreakdown,
  BeneficiaryTypeKey,
  DashboardUser,
  DashboardUserRole,
  DashboardProject,
  SectorDetails,
  SectorKey,
  SectorState,
  ProjectSector,
  BrandingSettings,
  ComplaintRecord,
} from "@/lib/dashboard-data";

type DashboardContextValue = {
  sectors: SectorState;
  reportingYears: number[];
  users: DashboardUser[];
  projects: DashboardProject[];
  updateSector: (sector: SectorKey, data: SectorDetails) => void;
  addReportingYear: (year: number) => void;
  removeReportingYear: (year: number) => void;
  addUser: (user: { name: string; email: string; role: DashboardUserRole; organization?: string }) => void;
  removeUser: (userId: string) => void;
  addProject: (project: Omit<DashboardProject, "id">) => void;
  updateProject: (projectId: string, updates: Partial<Omit<DashboardProject, "id">>) => void;
  removeProject: (projectId: string) => void;
  branding: BrandingSettings;
  updateBranding: (updates: Partial<BrandingSettings>) => void;
  complaints: ComplaintRecord[];
  addComplaint: (complaint: { fullName: string; email: string; phone?: string; message: string }) => void;
  removeComplaint: (complaintId: string) => void;
};

const DashboardDataContext = createContext<DashboardContextValue | null>(null);

const sanitizeBreakdown = (breakdown: BeneficiaryBreakdown | undefined): BeneficiaryBreakdown => {
  const result: BeneficiaryBreakdown = {
    direct: {} as Record<typeof BENEFICIARY_TYPE_KEYS[number], number>,
    indirect: {} as Record<typeof BENEFICIARY_TYPE_KEYS[number], number>,
  };

  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    result.direct[key] = breakdown?.direct?.[key]
      ? Math.max(0, Math.floor(breakdown.direct[key]!))
      : 0;
    result.indirect[key] = breakdown?.indirect?.[key]
      ? Math.max(0, Math.floor(breakdown.indirect[key]!))
      : 0;
  });

  return result;
};

const sanitizeStringList = (items: string[] | undefined): string[] =>
  (items ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);

const BRANDING_STORAGE_KEY = "nsdo-branding-settings";
const COMPLAINTS_STORAGE_KEY = "nsdo-complaints";

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [sectors, setSectors] = useState<SectorState>(INITIAL_SECTOR_STATE);
  const [reportingYears, setReportingYears] = useState<number[]>(
    Array.from(INITIAL_REPORTING_YEARS)
  );
  const [users, setUsers] = useState<DashboardUser[]>([...INITIAL_USERS]);
  const [projects, setProjects] = useState<DashboardProject[]>([...INITIAL_PROJECTS]);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const isBrandingHydratedRef = useRef(false);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([...DEFAULT_COMPLAINTS]);
  const isComplaintsHydratedRef = useRef(false);

  const updateSector = useCallback((sector: SectorKey, data: SectorDetails) => {
    setSectors((prev) => ({
      ...prev,
      [sector]: {
        ...data,
        provinces: [...data.provinces].sort((a, b) => a.localeCompare(b)),
        beneficiaries: sanitizeBreakdown(data.beneficiaries),
      },
    }));
  }, []);

  const addReportingYear = useCallback((year: number) => {
    setReportingYears((prev) => {
      if (!Number.isFinite(year)) return prev;
      if (prev.includes(year)) return prev;
      return [...prev, Math.floor(year)].sort((a, b) => a - b);
    });
  }, []);

  const removeReportingYear = useCallback((year: number) => {
    setReportingYears((prev) => prev.filter((item) => item !== year));
  }, []);

  const addUser = useCallback(
    (user: { name: string; email: string; role: DashboardUserRole; organization?: string }) => {
      setUsers((prev) => {
        const trimmedEmail = user.email.trim().toLowerCase();
        if (!trimmedEmail) {
          return prev;
        }

        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `user-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;

        const normalizedUser: DashboardUser = {
          id,
          name: user.name.trim() || "Unnamed User",
          email: trimmedEmail,
          role: user.role,
          organization: user.organization?.trim() || undefined,
        };

        const existing = prev.findIndex(
          (item) => item.email.toLowerCase() === normalizedUser.email
        );

        if (existing >= 0) {
          const next = [...prev];
          next[existing] = { ...next[existing], ...normalizedUser };
          return next;
        }

        return [...prev, normalizedUser];
      });
    },
    []
  );

  const removeUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  }, []);

  const addProject = useCallback((project: Omit<DashboardProject, "id">) => {
    setProjects((prev) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `project-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
      const normalized: DashboardProject = {
        id,
        ...project,
        name: project.name.trim() || "Untitled Project",
        sector: project.sector,
        clusters: sanitizeStringList(project.clusters),
        standardSectors: sanitizeStringList(project.standardSectors),
        goal: project.goal.trim(),
        objectives: project.objectives.trim(),
        majorAchievements: project.majorAchievements.trim(),
        beneficiaries: sanitizeBreakdown(project.beneficiaries),
        country: project.country.trim() || "Afghanistan",
        provinces: sanitizeStringList(project.provinces),
        districts: sanitizeStringList(project.districts),
        communities: sanitizeStringList(project.communities),
      };
      return [...prev, normalized];
    });
  }, []);

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Omit<DashboardProject, "id">>) => {
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) {
            return project;
          }
          return {
            ...project,
            ...updates,
            name: updates.name !== undefined ? updates.name.trim() || project.name : project.name,
            goal: updates.goal !== undefined ? updates.goal.trim() : project.goal,
            objectives:
              updates.objectives !== undefined ? updates.objectives.trim() : project.objectives,
            majorAchievements:
              updates.majorAchievements !== undefined
                ? updates.majorAchievements.trim()
                : project.majorAchievements,
            clusters:
              updates.clusters !== undefined
                ? sanitizeStringList(updates.clusters)
                : project.clusters,
            standardSectors:
              updates.standardSectors !== undefined
                ? sanitizeStringList(updates.standardSectors)
                : project.standardSectors,
            beneficiaries:
              updates.beneficiaries !== undefined
                ? sanitizeBreakdown(updates.beneficiaries)
                : project.beneficiaries,
            country:
              updates.country !== undefined
                ? (updates.country.trim() || project.country)
                : project.country,
            provinces:
              updates.provinces !== undefined
                ? sanitizeStringList(updates.provinces)
                : project.provinces,
            districts:
              updates.districts !== undefined
                ? sanitizeStringList(updates.districts)
                : project.districts,
            communities:
              updates.communities !== undefined
                ? sanitizeStringList(updates.communities)
                : project.communities,
          };
        })
      );
    },
    []
  );

  const removeProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  }, []);

  const updateBranding = useCallback((updates: Partial<BrandingSettings>) => {
    setBranding((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const addComplaint = useCallback(
    (complaint: { fullName: string; email: string; phone?: string; message: string }) => {
      setComplaints((prev) => {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `complaint-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
        const trimmedName = complaint.fullName.trim();
        const trimmedEmail = complaint.email.trim();
        const trimmedPhone = complaint.phone?.trim();
        const trimmedMessage = complaint.message.trim();

        if (!trimmedName || !trimmedEmail || !trimmedMessage) {
          return prev;
        }

        const record: ComplaintRecord = {
          id,
          fullName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || undefined,
          message: trimmedMessage,
          submittedAt: new Date().toISOString(),
        };

        return [record, ...prev];
      });
    },
    []
  );

  const removeComplaint = useCallback((complaintId: string) => {
    setComplaints((prev) => prev.filter((item) => item.id !== complaintId));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isBrandingHydratedRef.current) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(BRANDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<BrandingSettings>;
        setBranding((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch {
      // ignore malformed storage
    } finally {
      isBrandingHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isBrandingHydratedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
    } catch {
      // ignore write errors
    }
  }, [branding]);

  useEffect(() => {
    if (typeof window === "undefined" || isComplaintsHydratedRef.current) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(COMPLAINTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ComplaintRecord[];
        if (Array.isArray(parsed)) {
          setComplaints(parsed);
        }
      }
    } catch {
      // ignore malformed storage
    } finally {
      isComplaintsHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isComplaintsHydratedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(complaints));
    } catch {
      // ignore write errors
    }
  }, [complaints]);

  const value = useMemo(
    () => ({
      sectors,
      reportingYears,
      users,
      projects,
      updateSector,
      addReportingYear,
      removeReportingYear,
      addUser,
      removeUser,
      addProject,
      updateProject,
      removeProject,
      branding,
      updateBranding,
      complaints,
      addComplaint,
      removeComplaint,
    }),
    [
      sectors,
      reportingYears,
      users,
      projects,
      updateSector,
      addReportingYear,
      removeReportingYear,
      addUser,
      removeUser,
      addProject,
      updateProject,
      removeProject,
      branding,
      updateBranding,
      complaints,
      addComplaint,
      removeComplaint,
    ]
  );

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
  DEFAULT_BRANDING,
};
export type {
  SectorKey,
  SectorDetails,
  DashboardUser,
  DashboardUserRole,
  DashboardProject,
  ProjectSector,
  BeneficiaryBreakdown,
  BeneficiaryTypeKey,
  BrandingSettings,
};
