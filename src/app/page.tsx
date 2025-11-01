"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AfghanistanMap from "@/ui/AfghanistanMap";
import BeneficiaryDonut from "@/ui/BeneficiaryDonut";
import { useDashboardData } from "@/context/DashboardDataContext";
import {
  ALL_SECTOR_FIELD_ACTIVITY,
  ALL_SECTOR_KEY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  PROJECT_PHASES,
} from "@/lib/dashboard-data";
import type {
  BeneficiaryBreakdown,
  SectorDetails,
  SectorKey,
} from "@/lib/dashboard-data";
import Loading from "./loading";
import {
  TelegramCardLoader,
  TelegramChartLoader,
  TelegramSectionLoader,
  TelegramMapLoader,
} from "@/components/TelegramLoader";
import MobileQuickNav from "./(components)/MobileQuickNav";
import ReportDialog from "./(components)/ReportDialog";

type DashboardSectorKey = SectorKey | typeof ALL_SECTOR_KEY;

type SectorSnapshot = {
  provinces: string[];
  beneficiaries: BeneficiaryBreakdown;
};

type SectorSnapshotMap = Record<DashboardSectorKey, SectorSnapshot>;
type SectorDetailMap = Record<DashboardSectorKey, SectorDetails>;

const DEFAULT_START_LABEL = "Start date";
const DEFAULT_END_LABEL = "End date";

const BASE_SECTION_LINKS: Array<{ href: string; label: string }> = [
  { href: "#publish-dashboard", label: "Public Dashboard" },
  { href: "#project-management", label: "Project Management" },
  { href: "#monitoring", label: "Monitoring" },
  { href: "#evaluation", label: "Evaluation" },
  { href: "#accountability", label: "Accountability" },
  { href: "#findings-tracker", label: "Findings Tracker" },
  { href: "#pdm", label: "PDM" },
  { href: "#knowledge-hub", label: "Knowledge Hub" },
];

const PHASE_LABELS: Record<(typeof PROJECT_PHASES)[number], string> = {
  baseline: "Baseline",
  monitoring: "Monitoring",
  evaluation: "Evaluation",
  accountability: "Accountability",
  learning: "Learning",
};

const PHASE_STATUS_LABELS: Record<"not_started" | "in_progress" | "completed", string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const BASELINE_STATUS_LABELS: Record<"draft" | "in_progress" | "completed" | "archived", string> = {
  draft: "Draft",
  in_progress: "In progress",
  completed: "Completed",
  archived: "Archived",
};

const DATA_COLLECTION_STATUS_LABELS: Record<"pending" | "in_progress" | "completed", string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

const MONTHLY_STATUS_LABELS: Record<"draft" | "submitted" | "approved" | "feedback", string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  feedback: "Feedback",
};

const EVALUATION_TYPE_LABELS: Record<"baseline" | "midterm" | "endline" | "special", string> = {
  baseline: "Baseline",
  midterm: "Mid-term",
  endline: "Endline",
  special: "Special",
};

const STORY_TYPE_LABELS: Record<"case" | "success" | "impact", string> = {
  case: "Case Study",
  success: "Success Story",
  impact: "Impact Story",
};

const FINDING_SEVERITY_LABELS: Record<"minor" | "major" | "critical", string> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

const FINDING_STATUS_LABELS: Record<"pending" | "in_progress" | "solved", string> = {
  pending: "Pending",
  in_progress: "In progress",
  solved: "Solved",
};

const PHASE_STATUS_ORDER = ["completed", "in_progress", "not_started"] as const;
const BASELINE_STATUS_ORDER = ["draft", "in_progress", "completed", "archived"] as const;
const DATA_COLLECTION_STATUS_ORDER = ["pending", "in_progress", "completed"] as const;
const MONTHLY_STATUS_ORDER = ["draft", "submitted", "approved", "feedback"] as const;
const EVALUATION_TYPE_ORDER = ["baseline", "midterm", "endline", "special"] as const;
const STORY_TYPE_ORDER = ["case", "success", "impact"] as const;
const FINDING_SEVERITY_ORDER = ["critical", "major", "minor"] as const;
const FINDING_STATUS_ORDER = ["pending", "in_progress", "solved"] as const;

const createEmptyBreakdown = (): BeneficiaryBreakdown => {
  const direct: Record<typeof BENEFICIARY_TYPE_KEYS[number], number> = {} as Record<
    typeof BENEFICIARY_TYPE_KEYS[number],
    number
  >;
  const indirect: Record<typeof BENEFICIARY_TYPE_KEYS[number], number> = {} as Record<
    typeof BENEFICIARY_TYPE_KEYS[number],
    number
  >;

  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    direct[key] = 0;
    indirect[key] = 0;
  });

  return { direct, indirect };
};

const cloneBreakdown = (source: BeneficiaryBreakdown | undefined): BeneficiaryBreakdown => {
  const clone = createEmptyBreakdown();
  if (!source) {
    return clone;
  }

  BENEFICIARY_TYPE_KEYS.forEach((key) => {
    clone.direct[key] = source.direct?.[key] ?? 0;
    clone.indirect[key] = source.indirect?.[key] ?? 0;
  });

  return clone;
};

const formatDisplayDate = (value: string | null | undefined): string => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

export default function Home() {
  const {
    sectors,
    reportingYears,
    branding,
    isLoading,
    projects,
    projectDocuments,
    projectPhases,
    complaintMetrics,
    crmAwareness,
    monitoring,
    evaluation: evaluationData,
    findings: findingsData,
    pdm: pdmData,
    knowledgeHub,
    users,
    userAccessAssignments,
    integrations,
  } = useDashboardData();
  const router = useRouter();

  const baseSectorKeys = useMemo(
    () =>
      Object.keys(sectors)
        .filter((key) => key !== ALL_SECTOR_KEY) as SectorKey[],
    [sectors]
  );

  const [selectedSector, setSelectedSector] =
    useState<DashboardSectorKey>(ALL_SECTOR_KEY);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (reportingYears.length) {
      return reportingYears[reportingYears.length - 1]!;
    }
    return new Date().getFullYear();
  });
  const [beneficiaryView, setBeneficiaryView] =
    useState<"direct" | "indirect" | "total">("direct");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"Administrator" | "Editor" | "Viewer" | null>(null);
  const filterSentinelRef = useRef<HTMLDivElement | null>(null);
  const [isFilterPinned, setIsFilterPinned] = useState(false);
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuClosing(true);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsMobileMenuClosing(false);
    }, 300);
  }, []);

  const handleNavClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );

  const selectedProject = useMemo(() => {
    if (selectedProjectId === "all") {
      return null;
    }
    return projects.find((project) => project.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId]);

  const isBootstrapLoading = isLoading && baseSectorKeys.length === 0;

  const isAdmin = isAuthenticated && userRole === "Administrator";

  const navigableSections = useMemo(
    () =>
      isAdmin
        ? [...BASE_SECTION_LINKS, { href: "#admin-access", label: "Admin & Access" }]
        : BASE_SECTION_LINKS,
    [isAdmin]
  );

  useEffect(() => {
    if (reportingYears.length && !reportingYears.includes(selectedYear)) {
      setSelectedYear(reportingYears[reportingYears.length - 1]!);
    }
  }, [reportingYears, selectedYear]);

  useEffect(() => {
    if (baseSectorKeys.length && selectedSector === ALL_SECTOR_KEY) {
      return;
    }

    if (!baseSectorKeys.includes(selectedSector as SectorKey)) {
      setSelectedSector(baseSectorKeys[0] ?? ALL_SECTOR_KEY);
    }
  }, [baseSectorKeys, selectedSector]);

  useEffect(() => {
    if (selectedProjectId !== "all" && !selectedProject) {
      setSelectedProjectId("all");
    }
  }, [selectedProject, selectedProjectId]);

  useEffect(() => {
    if (selectedProject && selectedSector !== ALL_SECTOR_KEY) {
      setSelectedSector(ALL_SECTOR_KEY);
    }
  }, [selectedProject, selectedSector]);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!isMounted) {
          return;
        }
        if (!response.ok) {
          setIsAuthenticated(false);
          setUserRole(null);
          return;
        }
        const data: { user?: { role?: "Administrator" | "Editor" | "Viewer" } } = await response.json();
        setIsAuthenticated(true);
        setUserRole(data.user?.role ?? null);
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsProjectsMenuOpen(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const sentinel = filterSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFilterPinned(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-4px 0px 0px 0px",
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsNavVisible(true);
      } else {
        setIsNavVisible(false);
      }
      const sections = navigableSections.map((section) => {
        const element = document.querySelector(section.href);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: section.href,
            top: rect.top,
            bottom: rect.bottom,
          };
        }
        return null;
      }).filter(Boolean);

      const viewportMiddle = window.innerHeight / 2;
      
      let currentSection = "";
      let minDistance = Infinity;

      sections.forEach((section) => {
        if (section) {
          const sectionMiddle = (section.top + section.bottom) / 2;
          const distance = Math.abs(sectionMiddle - viewportMiddle);
          
          if (section.top <= viewportMiddle && section.bottom >= viewportMiddle) {
            if (distance < minDistance) {
              minDistance = distance;
              currentSection = section.id;
            }
          }
        }
      });

      if (!currentSection && sections.length > 0) {
        const firstVisibleSection = sections.find(
          (section) => section && section.bottom > 0
        );
        if (firstVisibleSection) {
          currentSection = firstVisibleSection.id;
        }
      }

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [navigableSections]);

  const sectorOrder: DashboardSectorKey[] = useMemo(
    () => [ALL_SECTOR_KEY, ...baseSectorKeys],
    [baseSectorKeys]
  );

  const {
    allProvinces,
    sectorSnapshots,
    sectorDetails,
  }: {
    allProvinces: string[];
    sectorSnapshots: SectorSnapshotMap;
    sectorDetails: SectorDetailMap;
  } = useMemo(() => {
    if (selectedProject) {
      const provinceList = Array.from(new Set(selectedProject.provinces ?? [])).sort((a, b) =>
        a.localeCompare(b)
      );
      const projectBeneficiaries = cloneBreakdown(selectedProject.beneficiaries);

      const snapshotMap: Partial<SectorSnapshotMap> = {};
      const detailMap: Partial<SectorDetailMap> = {};

      baseSectorKeys.forEach((key) => {
        snapshotMap[key] = {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
        };
        detailMap[key] = {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
          projects: 0,
          start: DEFAULT_START_LABEL,
          end: DEFAULT_END_LABEL,
          fieldActivity: "",
          staff: 0,
        };
      });

      snapshotMap[ALL_SECTOR_KEY] = {
        provinces: provinceList,
        beneficiaries: projectBeneficiaries,
      };

      detailMap[ALL_SECTOR_KEY] = {
        provinces: provinceList,
        beneficiaries: projectBeneficiaries,
        projects: 1,
        start: selectedProject.start || DEFAULT_START_LABEL,
        end: selectedProject.end || DEFAULT_END_LABEL,
        fieldActivity: selectedProject.goal || ALL_SECTOR_FIELD_ACTIVITY,
        staff: Math.max(selectedProject.staff ?? 0, 0),
      };

      return {
        allProvinces: provinceList,
        sectorSnapshots: snapshotMap as SectorSnapshotMap,
        sectorDetails: detailMap as SectorDetailMap,
      };
    }

    if (!baseSectorKeys.length) {
      const emptySnapshots: SectorSnapshotMap = {
        [ALL_SECTOR_KEY]: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
        },
        Humanitarian: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
        },
        Advocacy: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
        },
        Development: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
        },
      };

      const emptyDetails: SectorDetailMap = {
        [ALL_SECTOR_KEY]: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
          projects: 0,
          start: DEFAULT_START_LABEL,
          end: DEFAULT_END_LABEL,
          fieldActivity: ALL_SECTOR_FIELD_ACTIVITY,
          staff: 0,
        },
        Humanitarian: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
          projects: 0,
          start: DEFAULT_START_LABEL,
          end: DEFAULT_END_LABEL,
          fieldActivity: "",
          staff: 0,
        },
        Advocacy: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
          projects: 0,
          start: DEFAULT_START_LABEL,
          end: DEFAULT_END_LABEL,
          fieldActivity: "",
          staff: 0,
        },
        Development: {
          provinces: [],
          beneficiaries: createEmptyBreakdown(),
          projects: 0,
          start: DEFAULT_START_LABEL,
          end: DEFAULT_END_LABEL,
          fieldActivity: "",
          staff: 0,
        },
      };

      return {
        allProvinces: [],
        sectorSnapshots: emptySnapshots,
        sectorDetails: emptyDetails,
      };
    }

    const provinceSet = new Set<string>();
    const aggregatedBeneficiaries = createEmptyBreakdown();

    let totalProjects = 0;
    let totalStaff = 0;
    let earliestStart = Number.POSITIVE_INFINITY;
    let latestEnd = Number.NEGATIVE_INFINITY;
    let earliestStartLabel = DEFAULT_START_LABEL;
    let latestEndLabel = DEFAULT_END_LABEL;

    const snapshotMap: Partial<SectorSnapshotMap> = {};
    const detailMap: Partial<SectorDetailMap> = {};

    baseSectorKeys.forEach((key) => {
      const sector = sectors[key];
      sector.provinces.forEach((province) => provinceSet.add(province));

      BENEFICIARY_TYPE_KEYS.forEach((category) => {
        aggregatedBeneficiaries.direct[category] += sector.beneficiaries.direct?.[category] ?? 0;
        aggregatedBeneficiaries.indirect[category] +=
          sector.beneficiaries.indirect?.[category] ?? 0;
      });

      totalProjects += sector.projects;
      totalStaff += sector.staff;

      const startTime = Date.parse(sector.start);
      if (!Number.isNaN(startTime) && startTime < earliestStart) {
        earliestStart = startTime;
        earliestStartLabel = sector.start;
      }

      const endTime = Date.parse(sector.end);
      if (!Number.isNaN(endTime) && endTime > latestEnd) {
        latestEnd = endTime;
        latestEndLabel = sector.end;
      }

      snapshotMap[key] = {
        provinces: [...sector.provinces],
        beneficiaries: cloneBreakdown(sector.beneficiaries),
      };

      detailMap[key] = {
        provinces: [...sector.provinces],
        beneficiaries: cloneBreakdown(sector.beneficiaries),
        projects: sector.projects,
        start: sector.start,
        end: sector.end,
        fieldActivity: sector.fieldActivity,
        staff: sector.staff,
      };
    });

    const provinces = Array.from(provinceSet).sort((a, b) =>
      a.localeCompare(b)
    );

    snapshotMap[ALL_SECTOR_KEY] = {
      provinces,
      beneficiaries: cloneBreakdown(aggregatedBeneficiaries),
    };

    detailMap[ALL_SECTOR_KEY] = {
      provinces,
      beneficiaries: aggregatedBeneficiaries,
      projects: totalProjects,
      start: earliestStartLabel,
      end: latestEndLabel,
      fieldActivity: ALL_SECTOR_FIELD_ACTIVITY,
      staff: totalStaff,
    };

    return {
      allProvinces: provinces,
      sectorSnapshots: snapshotMap as SectorSnapshotMap,
      sectorDetails: detailMap as SectorDetailMap,
    };
  }, [baseSectorKeys, sectors, selectedProject]);

  const [focusedProvince, setFocusedProvince] = useState<string | null>(null);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);
  const projectsMenuRef = useRef<HTMLDivElement | null>(null);
  const [isDataEntryMenuOpen, setIsDataEntryMenuOpen] = useState(false);
  const dataEntryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const availableProvinces = sectorSnapshots[selectedSector]?.provinces ?? [];
    if (focusedProvince && !availableProvinces.includes(focusedProvince)) {
      setFocusedProvince(null);
    }
  }, [focusedProvince, sectorSnapshots, selectedSector]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideProjectsMenu =
        projectsMenuRef.current && projectsMenuRef.current.contains(target);
      const isInsideDataEntryMenu =
        dataEntryMenuRef.current && dataEntryMenuRef.current.contains(target);

      if (!isInsideProjectsMenu) {
        setIsProjectsMenuOpen(false);
      }

      if (!isInsideDataEntryMenu) {
        setIsDataEntryMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProjectsMenuOpen(false);
        setIsDataEntryMenuOpen(false);
        if (isMobileMenuOpen) {
          closeMobileMenu();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMobileMenu, isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setIsMobileMenuClosing(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("paddingRight");
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isMobileMenuOpen]);

  const handleSectorClick = (sector: DashboardSectorKey) => {
    if (sector === selectedSector) {
      return;
    }
    if (selectedProject && sector !== ALL_SECTOR_KEY) {
      return;
    }
    setSelectedSector(sector);
  };

  const handleProjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextProjectId = event.target.value || "all";
    setSelectedProjectId(nextProjectId);
  };

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextYear = Number(event.target.value);
    if (!Number.isNaN(nextYear)) {
      setSelectedYear(nextYear);
    }
  };

  const handleProvinceFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextProvince = event.target.value;
    setFocusedProvince(nextProvince ? nextProvince : null);
  };

  const handleMapProvinceSelect = useCallback(
    (province: string) => {
    setFocusedProvince((current) => (current === province ? null : province));
  },
    [setFocusedProvince]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignored -- fallback to client-side navigation regardless of network status.
    } finally {
      setIsAuthenticated(false);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const activeSnapshot = sectorSnapshots[selectedSector] ?? {
    provinces: [],
    beneficiaries: createEmptyBreakdown(),
  };

  const highlightedProvinces = useMemo(
    () => [...activeSnapshot.provinces],
    [activeSnapshot.provinces]
  );

  const beneficiaryRows = useMemo(
    () =>
      BENEFICIARY_TYPE_KEYS.map((category) => ({
        key: category,
        label: BENEFICIARY_TYPE_META[category].label,
        color: BENEFICIARY_TYPE_META[category].color,
        direct: activeSnapshot.beneficiaries.direct?.[category] ?? 0,
        indirect: activeSnapshot.beneficiaries.indirect?.[category] ?? 0,
      })),
    [activeSnapshot.beneficiaries.direct, activeSnapshot.beneficiaries.indirect]
  );

  const displayBeneficiaryRows = useMemo(
    () =>
      beneficiaryRows.map((row) => {
        const value =
          beneficiaryView === "total"
            ? row.direct + row.indirect
            : beneficiaryView === "direct"
            ? row.direct
            : row.indirect;

        return {
          ...row,
          value,
        };
      }),
    [beneficiaryRows, beneficiaryView]
  );

  const totalDirect = useMemo(
    () =>
      BENEFICIARY_TYPE_KEYS.reduce(
        (sum, category) => sum + (activeSnapshot.beneficiaries.direct?.[category] ?? 0),
        0
      ),
    [activeSnapshot.beneficiaries.direct]
  );

  const totalIndirect = useMemo(
    () =>
      BENEFICIARY_TYPE_KEYS.reduce(
        (sum, category) => sum + (activeSnapshot.beneficiaries.indirect?.[category] ?? 0),
        0
      ),
    [activeSnapshot.beneficiaries.indirect]
  );

  const totalBeneficiaries = totalDirect + totalIndirect;

  const beneficiarySlices = useMemo(
    () =>
      displayBeneficiaryRows.map((row) => ({
        label: row.label,
        value: row.value,
        color: row.color,
      })),
    [displayBeneficiaryRows]
  );

  const beneficiaryCandles = useMemo(
    () => [
      {
        key: "direct",
        label: "Direct Beneficiaries",
        value: totalDirect,
        share: totalBeneficiaries ? totalDirect / totalBeneficiaries : 0,
        highlight: beneficiaryView === "direct",
        color: "from-blue-500 to-blue-400",
      },
      {
        key: "indirect",
        label: "Indirect Beneficiaries",
        value: totalIndirect,
        share: totalBeneficiaries ? totalIndirect / totalBeneficiaries : 0,
        highlight: beneficiaryView === "indirect",
        color: "from-emerald-500 to-emerald-400",
      },
      {
        key: "total",
        label: "Total Beneficiaries",
        value: totalBeneficiaries,
        share: totalBeneficiaries ? 1 : 0,
        highlight: beneficiaryView === "total",
        color: "from-amber-500 to-amber-400",
      },
    ],
    [beneficiaryView, totalBeneficiaries, totalDirect, totalIndirect]
  );

  const topBeneficiaryRows = useMemo(() => {
    const sorted = [...displayBeneficiaryRows].sort((a, b) => b.value - a.value);
    const limit = Math.min(sorted.length, 4);
    return sorted.slice(0, limit);
  }, [displayBeneficiaryRows]);

  const currentBeneficiaryTotal =
    beneficiaryView === "total"
      ? totalBeneficiaries
      : beneficiaryView === "direct"
      ? totalDirect
      : totalIndirect;

  const beneficiaryViewLabel =
    beneficiaryView === "total"
      ? "Total"
      : beneficiaryView === "direct"
      ? "Direct"
      : "Indirect";

  const sectorDetail = sectorDetails[selectedSector] ?? {
    provinces: [],
    beneficiaries: createEmptyBreakdown(),
    projects: 0,
    start: DEFAULT_START_LABEL,
    end: DEFAULT_END_LABEL,
    fieldActivity: ALL_SECTOR_FIELD_ACTIVITY,
    staff: 0,
  };

  const filteredProjects = useMemo(
    () => (selectedProject ? [selectedProject] : projects),
    [projects, selectedProject]
  );
  const isProjectFiltered = Boolean(selectedProject);

  const projectStatusCounts = useMemo(() => {
    if (!filteredProjects.length) {
      return { active: 0, ongoing: 0, completed: 0 };
    }

    const nowTime = Date.now();

    return filteredProjects.reduce(
      (accumulator, project) => {
        const startTime = project.start ? Date.parse(project.start) : Number.NaN;
        const endTime = project.end ? Date.parse(project.end) : Number.NaN;

        const hasStart = !Number.isNaN(startTime);
        const hasEnd = !Number.isNaN(endTime);

        if (hasEnd && endTime < nowTime) {
          accumulator.completed += 1;
          return accumulator;
        }

        accumulator.active += 1;

        if (hasStart && startTime <= nowTime && (!hasEnd || endTime >= nowTime)) {
          accumulator.ongoing += 1;
        }

        return accumulator;
      },
      { active: 0, ongoing: 0, completed: 0 }
    );
  }, [filteredProjects]);

  const projectMetrics = useMemo(() => {
    const donors = new Set<string>();
    const provinces = new Set<string>();
    let totalBudget = 0;
    const phaseTotals: Record<"not_started" | "in_progress" | "completed", number> = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
    };
    const phasesByKey = PROJECT_PHASES.reduce(
      (accumulator, phase) => {
        accumulator[phase] = { not_started: 0, in_progress: 0, completed: 0 };
        return accumulator;
      },
      {} as Record<
        (typeof PROJECT_PHASES)[number],
        Record<"not_started" | "in_progress" | "completed", number>
      >
    );

    projects.forEach((project) => {
      if (project.donor) {
        donors.add(project.donor.trim());
      }
      project.provinces.forEach((province) => {
        if (province) {
          provinces.add(province);
        }
      });
      if (typeof project.budget === "number" && Number.isFinite(project.budget)) {
        totalBudget += project.budget;
      }
    });

    projectPhases.forEach((phase) => {
      const key = phase.phase;
      const status = phase.status;
      phaseTotals[status] += 1;
      phasesByKey[key][status] += 1;
    });

    return {
      totalProjects: projects.length,
      donorCount: donors.size,
      provincesCovered: provinces.size,
      totalBudget,
      documentCount: projectDocuments.length,
      phaseTotals,
      phasesByKey,
    };
  }, [projectDocuments.length, projectPhases, projects]);

  const monitoringSummary = useMemo(() => {
    const baselineByStatus: Record<"draft" | "in_progress" | "completed" | "archived", number> = {
      draft: 0,
      in_progress: 0,
      completed: 0,
      archived: 0,
    };
    const dataCollectionByStatus: Record<"pending" | "in_progress" | "completed", number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
    };
    const monthlyByStatus: Record<"draft" | "submitted" | "approved" | "feedback", number> = {
      draft: 0,
      submitted: 0,
      approved: 0,
      feedback: 0,
    };

    monitoring.baselineSurveys.forEach((survey) => {
      baselineByStatus[survey.status] += 1;
    });
    monitoring.dataCollectionTasks.forEach((task) => {
      dataCollectionByStatus[task.status] += 1;
    });
    monitoring.monthlyReports.forEach((report) => {
      monthlyByStatus[report.status] += 1;
    });

    const sharedReports = monitoring.baselineReports.filter((report) => report.sharedWithProgram).length;

    return {
      baselineByStatus,
      dataCollectionByStatus,
      monthlyByStatus,
      sharedReports,
      enumeratorCount: monitoring.enumerators.length,
      fieldVisitCount: monitoring.fieldVisits.length,
    };
  }, [monitoring]);

  const evaluationSummary = useMemo(() => {
    const evaluationsByType: Record<"baseline" | "midterm" | "endline" | "special", number> = {
      baseline: 0,
      midterm: 0,
      endline: 0,
      special: 0,
    };
    const storiesByType: Record<"case" | "success" | "impact", number> = {
      case: 0,
      success: 0,
      impact: 0,
    };

    evaluationData.evaluations.forEach((evaluationRecord) => {
      evaluationsByType[evaluationRecord.evaluationType] += 1;
    });
    evaluationData.stories.forEach((story) => {
      storiesByType[story.storyType] += 1;
    });

    return {
      evaluationsByType,
      storiesByType,
      totalStories: evaluationData.stories.length,
      spotlightStories: evaluationData.stories.slice(0, 3),
    };
  }, [evaluationData]);

  const crmDistrictsCount = useMemo(() => {
    const districts = new Set<string>();
    crmAwareness.forEach((record) => {
      if (record.district) {
        districts.add(record.district);
      }
    });
    return districts.size;
  }, [crmAwareness]);

  const pdmSummary = useMemo(() => {
    const aggregateScores = {
      quality: 0,
      quantity: 0,
      satisfaction: 0,
      protection: 0,
    };
    let scoredSurveys = 0;

    pdmData.surveys.forEach((survey) => {
      const { qualityScore, quantityScore, satisfactionScore, protectionScore } = survey;
      const scores = [qualityScore, quantityScore, satisfactionScore, protectionScore];
      if (scores.some((value) => typeof value === "number" && Number.isFinite(value))) {
        scoredSurveys += 1;
        aggregateScores.quality += qualityScore ?? 0;
        aggregateScores.quantity += quantityScore ?? 0;
        aggregateScores.satisfaction += satisfactionScore ?? 0;
        aggregateScores.protection += protectionScore ?? 0;
      }
    });

    const average = (value: number) =>
      scoredSurveys ? Math.round((value / scoredSurveys) * 10) / 10 : 0;

    return {
      distributionCount: pdmData.distributions.length,
      surveyCount: pdmData.surveys.length,
      reportCount: pdmData.reports.length,
      averageScores: {
        quality: average(aggregateScores.quality),
        quantity: average(aggregateScores.quantity),
        satisfaction: average(aggregateScores.satisfaction),
        protection: average(aggregateScores.protection),
      },
    };
  }, [pdmData]);

  const knowledgeSummary = useMemo(() => {
    const lessonThemes = new Set<string>();
    knowledgeHub.lessons.forEach((lesson) => {
      if (lesson.theme) {
        lessonThemes.add(lesson.theme);
      }
    });
    const resourceThemes = new Set<string>();
    knowledgeHub.resources.forEach((resource) => {
      if (resource.theme) {
        resourceThemes.add(resource.theme);
      }
    });

    return {
      lessonCount: knowledgeHub.lessons.length,
      resourceCount: knowledgeHub.resources.length,
      themesCovered: lessonThemes.size + resourceThemes.size,
    };
  }, [knowledgeHub]);

  const adminSummary = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    users.forEach((user) => {
      roleCounts[user.role] = (roleCounts[user.role] ?? 0) + 1;
    });

    const provinceAssignments = new Set(
      userAccessAssignments
        .filter((assignment) => assignment.province)
        .map((assignment) => `${assignment.userId}-${assignment.province}`)
    );

    const projectAssignments = new Set(
      userAccessAssignments
        .filter((assignment) => assignment.projectId)
        .map((assignment) => `${assignment.userId}-${assignment.projectId}`)
    );

    const integrationNames = integrations.map((integration) => integration.name).sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      roleCounts,
      provinceAssignments: provinceAssignments.size,
      projectAssignments: projectAssignments.size,
      integrationNames,
    };
  }, [integrations, userAccessAssignments, users]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    []
  );

  const projectKpiCards = useMemo(
    () => [
      {
        label: "Total Projects",
        value: projectMetrics.totalProjects.toLocaleString(),
        helper: "Portfolio size",
      },
      {
        label: "Active Donors",
        value: projectMetrics.donorCount.toLocaleString(),
        helper: "Funding partners engaged",
      },
      {
        label: "Provinces Covered",
        value: projectMetrics.provincesCovered.toLocaleString(),
        helper: "Geographic reach",
      },
      {
        label: "Portfolio Budget",
        value: currencyFormatter.format(projectMetrics.totalBudget || 0),
        helper: "Planned resources",
      },
      {
        label: "MEAL Documents",
        value: projectMetrics.documentCount.toLocaleString(),
        helper: "Plans & evidence stored",
      },
    ],
    [
      currencyFormatter,
      projectMetrics.documentCount,
      projectMetrics.donorCount,
      projectMetrics.provincesCovered,
      projectMetrics.totalBudget,
      projectMetrics.totalProjects,
    ]
  );

  const projectShowcase = useMemo(() => projects.slice(0, 6), [projects]);

  const monitoringKpiCards = useMemo(() => {
    const totalBaseline = Object.values(monitoringSummary.baselineByStatus).reduce(
      (sum, value) => sum + value,
      0
    );
    const totalDataCollection = Object.values(monitoringSummary.dataCollectionByStatus).reduce(
      (sum, value) => sum + value,
      0
    );
    const totalMonthly = Object.values(monitoringSummary.monthlyByStatus).reduce(
      (sum, value) => sum + value,
      0
    );
    return [
      {
        label: "Baseline Surveys",
        value: totalBaseline.toLocaleString(),
        helper: "Tools configured",
      },
      {
        label: "Enumerator Pool",
        value: monitoringSummary.enumeratorCount.toLocaleString(),
        helper: "Active staff assigned",
      },
      {
        label: "Data Collection Tasks",
        value: totalDataCollection.toLocaleString(),
        helper: "Tracking completion status",
      },
      {
        label: "Shared Baseline Reports",
        value: monitoringSummary.sharedReports.toLocaleString(),
        helper: "Delivered to programme",
      },
      {
        label: "Field Visits Logged",
        value: monitoringSummary.fieldVisitCount.toLocaleString(),
        helper: "Evidence with GPS & photos",
      },
      {
        label: "Monthly Narratives",
        value: totalMonthly.toLocaleString(),
        helper: "Reports captured",
      },
    ];
  }, [monitoringSummary]);

  const evaluationKpiCards = useMemo(
    () =>
      EVALUATION_TYPE_ORDER.map((type) => ({
        label: `${EVALUATION_TYPE_LABELS[type]} Evaluations`,
        value: evaluationSummary.evaluationsByType[type].toLocaleString(),
      })),
    [evaluationSummary.evaluationsByType]
  );

  const fieldVisitPreview = useMemo(() => monitoring.fieldVisits.slice(0, 4), [monitoring.fieldVisits]);
  const crmAwarenessPreview = useMemo(() => crmAwareness.slice(0, 6), [crmAwareness]);
  const findingsPreview = useMemo(
    () => findingsData.findings.slice(0, 6),
    [findingsData.findings]
  );
  const distributionsPreview = useMemo(
    () => pdmData.distributions.slice(0, 5),
    [pdmData.distributions]
  );
  const lessonsPreview = useMemo(() => knowledgeHub.lessons.slice(0, 5), [knowledgeHub.lessons]);
  const resourcesPreview = useMemo(
    () => knowledgeHub.resources.slice(0, 5),
    [knowledgeHub.resources]
  );

  const timelineProgress = useMemo(() => {
    const startDate = Date.parse(sectorDetail.start);
    const endDate = Date.parse(sectorDetail.end);

    if (Number.isNaN(startDate) || Number.isNaN(endDate) || endDate <= startDate) {
      return null;
    }

    const now = Date.now();
    if (now <= startDate) {
      return 0;
    }

    if (now >= endDate) {
      return 100;
    }

    const progress = Math.round(((now - startDate) / (endDate - startDate)) * 100);
    return Math.min(100, Math.max(0, progress));
  }, [sectorDetail.end, sectorDetail.start]);

  const timelineProgressDisplay = timelineProgress ?? 0;
  const timelineProgressLabel =
    timelineProgress !== null ? `${timelineProgressDisplay}% complete` : "0% complete";

  const totalStaff = Math.max(sectorDetail.staff, 0);
  const estimatedFieldStaff = Math.round(totalStaff * 0.7);
  const estimatedAdminStaff = Math.max(totalStaff - estimatedFieldStaff, 0);
  const fieldStaffShare = totalStaff ? Math.round((estimatedFieldStaff / totalStaff) * 100) : 0;
  const adminStaffShare = totalStaff ? Math.max(0, 100 - fieldStaffShare) : 0;

  const brandDisplayName = branding.companyName?.trim() || "Brand Placeholder";
  const brandLogo = branding.logoDataUrl;

  if (isBootstrapLoading) {
    return <Loading />;
  }

  return (
    <div className="scroll-smooth flex min-h-screen flex-col text-brand-strong">
      <nav className="sticky top-0 z-40 border-b border-brand bg-white/90 backdrop-blur-md shadow-brand-soft">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-6 text-brand-strong">
          <div className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-16 items-center">
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogo}
                  alt="Organisation logo"
                  className="max-h-12 sm:max-h-14 md:max-h-16 w-auto object-contain"
                />
              ) : (
                <div className="flex h-12 sm:h-14 md:h-16 min-w-[60px] sm:min-w-[72px] items-center justify-center rounded-xl border border-brand bg-brand-soft px-3 sm:px-5">
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-brand-muted">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <span className="hidden sm:inline text-xs sm:text-sm font-semibold tracking-tight text-brand-muted">
              {brandDisplayName}
            </span>
          </div>

          <div className="hidden lg:flex flex-1 justify-center text-sm font-medium">
            <a
              href="#publish-dashboard"
              onClick={(e) => handleNavClick(e, "#publish-dashboard")}
              className="inline-flex h-11 min-w-[180px] items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold chip-brand-soft"
            >
              Public Dashboard
            </a>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm font-medium text-brand-muted">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => {
                if (isMobileMenuOpen) {
                  closeMobileMenu();
                } else {
                  setIsMobileMenuOpen(true);
                }
              }}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand bg-white text-brand-primary hover:bg-brand-soft transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {(isMobileMenuOpen && !isMobileMenuClosing) ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            {isAuthenticated ? (
              <>
                <div
                  ref={projectsMenuRef}
                  className="relative hidden md:block"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsProjectsMenuOpen((open) => !open);
                      setIsDataEntryMenuOpen(false);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={isProjectsMenuOpen}
                    className="inline-flex h-9 sm:h-10 md:h-11 items-center gap-1 sm:gap-2 whitespace-nowrap rounded-full px-3 sm:px-4 md:px-5 text-xs sm:text-sm font-semibold chip-brand"
                  >
                    <span className="hidden sm:inline">Projects</span>
                    <span className="sm:hidden">Proj</span>
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {isProjectsMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-brand bg-white p-3 text-sm shadow-brand-soft"
                    >
                      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      Projects
                    </p>
                    <div className="mt-3 space-y-1">
                      <Link
                        href="/projects"
                        onClick={() => setIsProjectsMenuOpen(false)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 menu-item-brand"
                      >
                        <span>Project Registry</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                          New
                        </span>
                      </Link>
                      <Link
                        href="/projects/registered"
                        onClick={() => setIsProjectsMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 menu-item-brand"
                      >
                        <span>Registered Projects</span>
                      </Link>
                      <Link
                        href="/projects/catalog-modifier"
                        onClick={() => setIsProjectsMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 menu-item-brand"
                      >
                        <span>Cluster &amp; Sector Modifier</span>
                      </Link>
                      <button
                        type="button"
                        disabled
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-brand-soft transition"
                      >
                          <span>Pipeline Planner</span>
                          <span className="rounded-full border border-brand px-2 py-0.5 text-[10px] uppercase tracking-wide text-brand-muted">
                            Coming soon
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div
                  ref={dataEntryMenuRef}
                  className="relative hidden md:block"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsDataEntryMenuOpen((open) => !open);
                      setIsProjectsMenuOpen(false);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={isDataEntryMenuOpen}
                    className="inline-flex h-9 sm:h-10 md:h-11 items-center gap-1 sm:gap-2 whitespace-nowrap rounded-full px-3 sm:px-4 md:px-5 text-xs sm:text-sm font-semibold chip-brand"
                  >
                    <span className="hidden sm:inline">Data Entry</span>
                    <span className="sm:hidden">Data</span>
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {isDataEntryMenuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-brand bg-white p-3 text-sm shadow-brand-soft"
                    >
                      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                        Data Entry
                      </p>
                      <div className="mt-3 space-y-1">
                        <Link
                          href="/data-entry/monitoring"
                          onClick={() => setIsDataEntryMenuOpen(false)}
                          className="flex w-full items-center rounded-lg px-3 py-2 menu-item-brand"
                        >
                          <span>Monitoring</span>
                        </Link>
                        <Link
                          href="/data-entry/evaluation"
                          onClick={() => setIsDataEntryMenuOpen(false)}
                          className="flex w-full items-center rounded-lg px-3 py-2 menu-item-brand"
                        >
                          <span>Evaluation</span>
                        </Link>
                        <Link
                          href="/data-entry/accountability"
                          onClick={() => setIsDataEntryMenuOpen(false)}
                          className="flex w-full items-center rounded-lg px-3 py-2 menu-item-brand"
                        >
                          <span>Accountability</span>
                        </Link>
                        <Link
                          href="/data-entry/lesson-learns"
                          onClick={() => setIsDataEntryMenuOpen(false)}
                          className="flex w-full items-center rounded-lg px-3 py-2 menu-item-brand"
                        >
                          <span>Lesson Learns</span>
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
                <Link
                  href="/complaints"
                  className="hidden sm:inline-flex h-9 sm:h-10 md:h-11 items-center justify-center whitespace-nowrap rounded-full px-3 sm:px-4 md:px-5 text-xs sm:text-sm font-semibold chip-brand"
                >
                  Complaints
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex h-9 sm:h-10 md:h-11 items-center justify-center whitespace-nowrap rounded-full px-3 sm:px-4 md:px-5 text-xs sm:text-sm font-semibold chip-brand"
                  >
                    Admin
                  </Link>
                ) : null}
              </>
            ) : null}
            <Link
              href="/complaint-form"
              className="hidden sm:inline-flex h-9 sm:h-10 md:h-11 items-center justify-center whitespace-nowrap rounded-full px-3 sm:px-4 md:px-5 text-xs sm:text-sm font-semibold chip-brand"
            >
              <span className="hidden md:inline">Complaint Form</span>
              <span className="md:hidden">Complaint</span>
            </Link>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                className="inline-flex h-9 sm:h-10 md:h-11 items-center justify-center whitespace-nowrap rounded-full px-4 sm:px-5 md:px-6 text-xs sm:text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
              >
                <span className="hidden sm:inline">Log Out</span>
                <span className="sm:hidden">Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 sm:h-10 md:h-11 items-center justify-center whitespace-nowrap rounded-full px-4 sm:px-5 md:px-6 text-xs sm:text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
              >
                <span className="hidden sm:inline">Log In</span>
                <span className="sm:hidden">In</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <MobileQuickNav
        sections={navigableSections}
        activeSection={activeSection}
        onNavClick={handleNavClick}
      />

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden ${
              isMobileMenuClosing ? 'animate-fade-out' : 'animate-fade-in'
            }`}
            onClick={closeMobileMenu}
          />
          
          {/* Drawer */}
          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            className={`fixed right-0 top-16 bottom-0 z-50 w-full max-w-sm bg-white border-l border-brand shadow-2xl overflow-y-auto md:hidden ${
              isMobileMenuClosing ? "animate-slide-out-right" : "animate-slide-in-right"
            }`}
          >
            <div className="flex flex-col p-4 gap-3 sm:gap-4">
              {isAuthenticated ? (
                <>
                  {/* Projects Section */}
                  <div className="border-b border-brand pb-3 mb-1">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      Projects
                    </p>
                    <Link
                      href="/projects"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Project Registry</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                        New
                      </span>
                    </Link>
                    <Link
                      href="/projects/registered"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Registered Projects</span>
                    </Link>
                    <Link
                      href="/projects/catalog-modifier"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Cluster &amp; Sector Modifier</span>
                    </Link>
                  </div>

                  {/* Data Entry Section */}
                  <div className="border-b border-brand pb-3 mb-1">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      Data Entry
                    </p>
                    <Link
                      href="/data-entry/monitoring"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Monitoring</span>
                    </Link>
                    <Link
                      href="/data-entry/evaluation"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Evaluation</span>
                    </Link>
                    <Link
                      href="/data-entry/accountability"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Accountability</span>
                    </Link>
                    <Link
                      href="/data-entry/lesson-learns"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Lesson Learns</span>
                    </Link>
                  </div>

                  {/* Other Links */}
                  <Link
                    href="/complaints"
                    onClick={closeMobileMenu}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                  >
                    <span>Complaints</span>
                  </Link>
                  
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
                    >
                      <span>Admin</span>
                    </Link>
                  ) : null}
                </>
              ) : null}

              {/* Quick Navigation */}
              <div className="border-b border-brand pb-3 mb-1">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Quick Navigation
                </p>
                <div className="mt-2 space-y-1.5">
                  {navigableSections.map((section) => {
                    const isActive = activeSection === section.href;
                    return (
                      <a
                        key={section.href}
                        href={section.href}
                        onClick={(e) => {
                          closeMobileMenu();
                          handleNavClick(e, section.href);
                        }}
                        className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? "border-[#2f8230] bg-gradient-to-r from-[#3ea93d] to-[#2f8230] text-white shadow-brand-soft"
                            : "border-transparent bg-brand-soft/60 text-brand-strong hover:border-[#3ea93d] hover:bg-gradient-to-r hover:from-[#3ea93d] hover:to-[#2f8230] hover:text-white"
                        }`}
                      >
                        <span>{section.label}</span>
                        <svg
                          className={`h-3 w-3 transition-transform duration-200 ${
                            isActive ? "translate-x-1 text-white" : "text-brand-primary group-hover:text-white"
                          }`}
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 3L8 6L5 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    );
                  })}
                </div>
              </div>

              <Link
                href="/complaint-form"
                onClick={closeMobileMenu}
                className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium menu-item-brand"
              >
                <span>Complaint Form</span>
              </Link>

              {/* Auth Button */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    void handleSignOut();
                  }}
                  className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
                >
                  Log Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="mt-4 w-full block text-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      <aside
        className={`fixed right-3 sm:right-4 md:right-6 top-1/2 z-50 hidden xl:flex -translate-y-1/2 transform rounded-2xl border border-brand bg-white/90 shadow-xl shadow-brand-soft/40 backdrop-blur-md transition-all duration-300 ease-out flex-col ${
          isSideNavCollapsed ? "w-14 sm:w-16 p-2" : "w-56 sm:w-64 p-3"
        } ${isNavVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className={`flex items-center gap-2 ${isSideNavCollapsed ? "justify-center" : "justify-between"}`}>
          {!isSideNavCollapsed && (
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted transition-opacity duration-200">
              Navigate
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsSideNavCollapsed((previous) => !previous)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-brand bg-white text-brand-primary shadow-sm transition-all duration-200 hover:bg-brand-soft hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3ea93d]"
            aria-label={isSideNavCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={isSideNavCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {isSideNavCollapsed ? (
              <svg
                className="h-4 w-4 transition-transform duration-300"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 3L4.5 6L7.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 transition-transform duration-300"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.5 3L7.5 6L4.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        
        {isSideNavCollapsed ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            {navigableSections.map((section) => {
              const isActive = activeSection === section.href;
              return (
                <a
                  key={section.href}
                  href={section.href}
                  onClick={(e) => handleNavClick(e, section.href)}
                  className={`group relative flex h-10 w-10 items-center justify-center rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-[1px] hover:scale-105 ${
                    isActive
                      ? "border-brand-primary bg-brand-primary text-white shadow-lg scale-110"
                      : "border-brand bg-white text-brand-strong hover:border-brand-primary hover:bg-brand-primary hover:text-white"
                  }`}
                  title={section.label}
                >
                  <span className="pointer-events-none select-none">
                    {section.label
                      .split(" ")
                      .map((word) => word.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute right-full mr-3 hidden rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg group-hover:block whitespace-nowrap z-50">
                    {section.label}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                  </div>
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
                    </span>
                  )}
                </a>
              );
            })}
            <button
              type="button"
              onClick={() => setIsReportDialogOpen(true)}
              className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white shadow-brand-soft transition hover:scale-105"
              title="Generate PDF report"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 2.5A1.5 1.5 0 0 1 5.5 1h5.586L16 5.414V16.5A1.5 1.5 0 0 1 14.5 18h-9A1.5 1.5 0 0 1 4 16.5v-14Z" fill="currentColor" opacity="0.3" />
                <path d="M11 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11h6M7 14h6M7 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {navigableSections.map((section) => {
              const isActive = activeSection === section.href;
              return (
                <a
                  key={section.href}
                  href={section.href}
                  onClick={(e) => handleNavClick(e, section.href)}
                  className={`group inline-flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3ea93d] ${
                    isActive
                      ? "border-brand-primary bg-gradient-to-r from-brand-primary to-[#3ea93d] text-white shadow-lg scale-[1.02]"
                      : "border-brand bg-white text-brand-strong hover:border-brand-primary hover:bg-gradient-to-r hover:from-brand-primary hover:to-[#3ea93d] hover:text-white"
                  }`}
                >
                  <span>{section.label}</span>
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 ${
                      isActive ? "text-white" : "text-brand-primary group-hover:text-white"
                    }`}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 3L8 6L5 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              );
            })}
            
            {/* Navigation help text */}
            <div className="mt-2 rounded-lg bg-brand-soft/30 px-3 py-2 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-brand-soft">
                Quick Navigation
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsReportDialogOpen(true)}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary hover:text-white"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.5 1h5.586L16 5.414V16.5A1.5 1.5 0 0 1 14.5 18h-9A1.5 1.5 0 0 1 4 16.5v-14A1.5 1.5 0 0 1 5.5 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M11 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11h6M7 14h6M7 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              PDF Report
            </button>
          </div>
        )}
      </aside>
      <section className="border-b border-brand bg-brand-soft">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wide text-brand-primary">
            Working Sectors
          </h2>
          <div className="flex flex-wrap flex-row-reverse items-center justify-end gap-2 sm:gap-3 md:gap-4">
            {sectorOrder.map((sector) => {
              const isActive = selectedSector === sector;
              const isDisabled = isProjectFiltered && sector !== ALL_SECTOR_KEY;
              return (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleSectorClick(sector)}
                  aria-pressed={isActive}
                  disabled={isDisabled}
                  className={`relative min-w-[100px] sm:min-w-[140px] md:min-w-[170px] overflow-hidden rounded-full px-4 sm:px-6 md:px-7 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base font-semibold text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3ea93d] ${
                    isDisabled
                      ? "chip-brand-soft cursor-not-allowed opacity-50"
                      : isActive
                      ? "btn-brand text-white shadow-brand-soft scale-[1.05]"
                      : "chip-brand-soft hover:scale-[1.02]"
                  }`}
                >
                  {sector}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div ref={filterSentinelRef} aria-hidden="true" className="h-px w-full" />
      <div
        className={`z-30 border-b border-brand bg-white transition-all duration-300 ease-in-out ${
          isFilterPinned 
            ? "sticky top-[calc(4rem)] shadow-xl shadow-brand-soft/40" 
            : ""
        }`}
      >
        <div className="mx-auto max-w-7xl">
          <div
            className={`flex w-full flex-wrap items-center gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4 transition-all duration-300 ${
              isFilterPinned
                ? "backdrop-blur-md"
                : ""
            }`}
          >
            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft">
                Filters
              </h3>
              <p className="text-xs sm:text-sm font-medium text-brand-muted">
                Tailor dashboard insights
              </p>
            </div>
            <div className="flex flex-1 w-full sm:w-auto flex-wrap items-center gap-3 sm:gap-4">
              <label className="flex flex-1 min-w-[160px] sm:min-w-[200px] md:min-w-[220px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Project
                </span>
                <div className="relative">
                  <select
                    id="project-filter"
                    value={selectedProjectId}
                    onChange={handleProjectChange}
                    className="input-brand w-full appearance-none rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium"
                  >
                    <option value="all">All Projects</option>
                    {sortedProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-soft">
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </label>
              <label className="flex flex-1 min-w-[140px] sm:min-w-[160px] md:min-w-[180px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Reporting Year
                </span>
                <div className="relative">
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="input-brand w-full appearance-none rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium"
                  >
                    {reportingYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-soft">
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </label>
              <label className="flex flex-1 min-w-[160px] sm:min-w-[200px] md:min-w-[220px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Province Focus
                </span>
                <div className="relative">
                  <select
                    id="province-filter"
                    value={focusedProvince ?? ""}
                    onChange={handleProvinceFilterChange}
                    className="input-brand w-full appearance-none rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium"
                  >
                    <option value="">All Active Provinces</option>
                    {allProvinces.map((province) => {
                      const isAvailable = highlightedProvinces.includes(province);
                      return (
                        <option
                          key={province}
                          value={province}
                          disabled={!isAvailable}
                        >
                          {province}
                          {isAvailable ? "" : " • Inactive"}
                        </option>
                      );
                    })}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-soft">
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </label>
              <div className="flex flex-1 min-w-[160px] sm:min-w-[200px] md:min-w-[220px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Beneficiary View
                </span>
                <div className="flex overflow-hidden rounded-full border border-brand bg-brand-soft">
                  <button
                    type="button"
                    onClick={() => setBeneficiaryView("direct")}
                    className={`flex-1 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-semibold ${
                      beneficiaryView === "direct"
                        ? "toggle-pill toggle-pill-active"
                        : "toggle-pill"
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeneficiaryView("indirect")}
                    className={`flex-1 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-semibold ${
                      beneficiaryView === "indirect"
                        ? "toggle-pill toggle-pill-active"
                        : "toggle-pill"
                    }`}
                  >
                    Indirect
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeneficiaryView("total")}
                    className={`flex-1 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-semibold ${
                      beneficiaryView === "total"
                        ? "toggle-pill toggle-pill-active"
                        : "toggle-pill"
                    }`}
                  >
                    Total
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 sm:gap-8 px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        {/* Dashboard Grid Section */}
        <section
          className="flex flex-col gap-6"
          id="publish-dashboard"
        >

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8">
            <div className="space-y-6">
              {/* Map Overview */}
              {isLoading ? (
                <TelegramMapLoader />
              ) : (
                <div className="flex flex-col overflow-hidden rounded-xl border border-brand bg-white shadow-sm">
                <div className="flex flex-col gap-1 border-b border-brand bg-gradient-to-r from-[#e6f6ea] to-[#f7fdf9] px-6 py-4">
                  <span className="text-base font-semibold uppercase tracking-wide text-brand-muted">
                    Afghanistan Provincial Coverage
                  </span>
                  <p className="text-sm text-brand-soft">
                    {selectedSector.toLowerCase()} sector operations • Use filters to focus on specific provinces
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    <span className="rounded-full bg-white px-3 py-1 text-brand-muted shadow-sm">
                      Year {selectedYear}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-brand-muted shadow-sm">
                      {highlightedProvinces.length} Active Province
                      {highlightedProvinces.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-center bg-brand-soft p-4">
                  <div
                    className="w-full max-w-3xl"
                    style={{ aspectRatio: "4 / 3" }}
                  >
                    <AfghanistanMap
                      focusedProvince={focusedProvince}
                      highlightedProvinces={highlightedProvinces as string[]}
                      className="h-full w-full"
                      onProvinceSelect={handleMapProvinceSelect}
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Project Status */}
              {isLoading ? (
                <div className="rounded-2xl border border-brand bg-white p-6 shadow-sm">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 w-1/3 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[...Array(3)].map((_, i) => (
                        <TelegramCardLoader key={i} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-brand bg-white shadow-sm">
                <div className="border-b border-brand bg-gradient-to-r from-[#e6f6ea] to-[#f7fdf9] px-6 py-4">
                  <h3 className="text-base font-semibold uppercase tracking-wide text-brand-muted">
                    Project Status
                  </h3>
                  <p className="text-sm text-brand-soft">
                    Snapshot across current portfolio coverage.
                  </p>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-3">
                  <div className="flex flex-col gap-1 rounded-lg border border-brand bg-brand-soft px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      Active Projects
                    </span>
                    <span className="text-2xl font-semibold text-brand-strong">
                      {projectStatusCounts.active}
                    </span>
                    <span className="text-xs text-brand-soft">
                      Mobilised initiatives not yet completed.
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-brand bg-brand-soft px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      Completed Projects
                    </span>
                    <span className="text-2xl font-semibold text-brand-strong">
                      {projectStatusCounts.completed}
                    </span>
                    <span className="text-xs text-brand-soft">
                      Closed out within the reporting window.
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-brand bg-brand-soft px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      Ongoing Projects
                    </span>
                    <span className="text-2xl font-semibold text-brand-strong">
                      {projectStatusCounts.ongoing}
                    </span>
                    <span className="text-xs text-brand-soft">
                      Currently in implementation.
                    </span>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Beneficiary Donut Chart */}
            {isLoading ? (
              <TelegramChartLoader />
            ) : (
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-brand bg-white shadow-sm">
              <div className="border-b border-brand bg-gradient-to-r from-[#e6f6ea] to-[#f7fdf9] px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold uppercase tracking-wide text-brand-muted">
                      Beneficiary Distribution
                    </h2>
                    <p className="text-sm text-brand-soft">
                      {selectedSector} • {selectedYear}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    <span className="rounded-full bg-white px-3 py-1 text-brand-muted shadow-sm">
                      Direct {totalDirect.toLocaleString()}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-brand-muted shadow-sm">
                      Indirect {totalIndirect.toLocaleString()}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-brand-muted shadow-sm">
                      Total {totalBeneficiaries.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="flex flex-1 items-center justify-center">
                    <BeneficiaryDonut
                      data={beneficiarySlices}
                      className="h-80 w-full"
                      showLegend={false}
                      title={`${beneficiaryViewLabel} Beneficiaries`}
                      subtitle={`${currentBeneficiaryTotal.toLocaleString()} people across ${highlightedProvinces.length} province${highlightedProvinces.length === 1 ? "" : "s"}`}
                    />
                  </div>
                  {topBeneficiaryRows.length ? (
                    <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      {topBeneficiaryRows.map((row) => (
                        <div key={row.key} className="flex flex-col gap-1 rounded-lg border border-brand bg-brand-soft px-3 py-2">
                          <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                            <span
                              className="inline-flex h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            {row.label}
                          </dt>
                          <dd className="text-base font-semibold text-brand-strong">
                            {row.value.toLocaleString()}
                          </dd>
                          <dd className="text-[11px] uppercase tracking-wide text-brand-soft">
                            {currentBeneficiaryTotal
                              ? `${((row.value / currentBeneficiaryTotal) * 100).toFixed(1)}%`
                              : "0%"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-6 text-center text-xs uppercase tracking-wide text-brand-soft">
                      No beneficiary data available.
                    </p>
                  )}
                </div>
            </div>
            )}
          </div>
        </section>

        {/* Full-Width Sector Overview with Charts */}
        {isLoading ? (
          <section className="w-full">
            <div className="overflow-hidden rounded-2xl border border-brand bg-white shadow-sm p-8">
              <div className="animate-pulse space-y-8">
                <div className="h-6 w-1/3 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <TelegramCardLoader key={i} />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-64 rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="w-full">
          <div className="overflow-hidden rounded-2xl border border-brand bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-brand px-8 py-6">
              <div>
                <h2 className="text-2xl font-semibold text-brand-strong">
                  {selectedSector} Sector Overview
                </h2>
                <p className="text-sm text-brand-soft">
                  Snapshot of operating performance and reach • {selectedYear}
                </p>
              </div>
              <div className="flex flex-1 flex-wrap items-end justify-end gap-8 text-right">
                {beneficiaryCandles.map((candle) => {
                  const heightPercent =
                    candle.share > 0 ? Math.max(candle.share * 100, 16) : 4;
                  const percentLabel =
                    candle.key === "total"
                      ? "100% of total"
                      : totalBeneficiaries
                      ? `${Math.round(candle.share * 100)}% of total`
                      : "0% of total";

                  return (
                    <div
                      key={candle.key}
                      className={`flex flex-col items-center gap-2 ${
                        candle.highlight ? "text-brand-strong" : "text-brand-soft"
                      }`}
                    >
                      <div className="flex h-32 w-10 items-end justify-center">
                        <div className="relative flex h-full w-1.5 justify-center rounded-full bg-brand-tint">
                          <span
                            className={`absolute bottom-0 w-1.5 rounded-full bg-gradient-to-b ${candle.color}`}
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span
                            className={`absolute -top-2 hidden h-3 w-3 rounded-full bg-gradient-to-r ${candle.color} shadow-sm ${
                              candle.share > 0 ? "sm:block" : ""
                            }`}
                          />
                        </div>
                      </div>
                      <div
                        className={`text-3xl font-bold ${
                          candle.highlight ? "text-blue-600" : "text-brand-strong"
                        }`}
                      >
                        {candle.value.toLocaleString()}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                        {candle.label}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-brand-soft">
                        {percentLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-8 px-8 py-6">
              {/* Snapshot Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-brand bg-brand-soft px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    Active Projects
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-brand-strong">
                    {sectorDetail.projects}
                  </div>
                  <p className="mt-1 text-xs text-brand-soft">
                    Running initiatives in {highlightedProvinces.length} province
                    {highlightedProvinces.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-xl border border-brand bg-brand-soft px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    Team Deployment
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-brand-strong">
                    {sectorDetail.staff}
                  </div>
                  <p className="mt-1 text-xs text-brand-soft">
                    {highlightedProvinces.length
                      ? `${Math.round(
                          sectorDetail.staff / highlightedProvinces.length
                        )} staff per province on average`
                      : "Awaiting deployment coverage"}
                  </p>
                </div>
                <div className="rounded-xl border border-brand bg-brand-soft px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    Avg. {beneficiaryViewLabel} Beneficiaries / Province
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-brand-strong">
                    {highlightedProvinces.length
                      ? Math.round(
                          currentBeneficiaryTotal / highlightedProvinces.length
                        ).toLocaleString()
                      : "0"}
                  </div>
                  <p className="mt-1 text-xs text-brand-soft">
                    Coverage rate{" "}
                    {allProvinces.length
                      ? Math.round(
                          (highlightedProvinces.length / allProvinces.length) * 100
                        )
                      : 0}
                    % nationwide
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-8">
                <div className="space-y-6">
                  {/* Timeline */}
                  <div className="rounded-xl border border-brand px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-brand-strong">
                          Delivery Timeline
                        </h3>
                        <p className="text-xs uppercase tracking-wide text-brand-soft">
                          {sectorDetail.start} → {sectorDetail.end}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-muted">
                        {timelineProgressLabel}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="h-2 w-full rounded-full bg-brand-tint">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${timelineProgressDisplay}%` }}
                        />
                      </div>
                      <p className="text-sm text-brand-muted">
                        Current focus:{" "}
                        <span className="font-medium">{sectorDetail.fieldActivity}</span>
                      </p>
                    </div>
                  </div>

                  {/* Coverage */}
                  <div className="rounded-xl border border-brand px-6 py-5">
                    <h3 className="text-base font-semibold text-brand-strong">
                      Geographic Coverage
                    </h3>
                    <p className="text-sm text-brand-soft">
                      Operating across {highlightedProvinces.length} province
                      {highlightedProvinces.length !== 1 ? "s" : ""}. Select filters to refine the focus area.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {highlightedProvinces.slice(0, 8).map((province) => (
                        <span
                          key={province}
                          className={`rounded-lg border px-3 py-2 text-center font-medium ${
                            focusedProvince === province
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-brand bg-white text-brand-muted"
                          }`}
                        >
                          {province}
                        </span>
                      ))}
                    </div>
                    {highlightedProvinces.length > 8 ? (
                      <p className="mt-3 text-xs text-brand-soft">
                        +{highlightedProvinces.length - 8} more provinces covered
                      </p>
                    ) : null}
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg border border-brand bg-brand-soft px-3 py-2">
                        <span className="text-brand-soft">Coverage Rate</span>
                        <span className="font-semibold text-brand-strong">
                          {allProvinces.length
                            ? Math.round(
                                (highlightedProvinces.length / allProvinces.length) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-brand bg-brand-soft px-3 py-2">
                        <span className="text-brand-soft">Projects / Province</span>
                        <span className="font-semibold text-brand-strong">
                          {highlightedProvinces.length
                            ? (sectorDetail.projects / highlightedProvinces.length).toFixed(1)
                            : "0.0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Human Resources */}
                  <div className="rounded-xl border border-brand px-6 py-5">
                    <h3 className="text-base font-semibold text-brand-strong">
                      Human Resources
                    </h3>
                    <p className="text-sm text-brand-soft">
                      Deployment mix for on-ground and coordination teams.
                    </p>
                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-brand-muted">Field Staff</span>
                          <span className="font-semibold text-brand-strong">
                            {estimatedFieldStaff}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-brand-tint">
                          <div
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${fieldStaffShare}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-brand-muted">Admin Staff</span>
                          <span className="font-semibold text-brand-strong">
                            {estimatedAdminStaff}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-brand-tint">
                          <div
                            className="h-2 rounded-full bg-emerald-300"
                            style={{ width: `${adminStaffShare}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-brand bg-brand-soft px-3 py-2 text-sm">
                        <span className="text-brand-muted">Total Team</span>
                        <span className="font-semibold text-brand-strong">{sectorDetail.staff}</span>
                      </div>
                    </div>
                  </div>

                  {/* Beneficiaries */}
                  <div className="rounded-xl border border-brand px-6 py-5">
                    <h3 className="text-base font-semibold text-brand-strong">
                      Beneficiary Breakdown
                    </h3>
                    <p className="text-sm text-brand-soft">
                      Distribution across demographic segments for the active year.
                    </p>
                    <div className="mt-5 overflow-hidden rounded-xl border border-brand">
                      <table className="min-w-full divide-y divide-emerald-100 text-sm">
                        <thead className="bg-brand-soft text-xs font-semibold uppercase tracking-wide text-brand-soft">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left">
                              Cohort
                            </th>
                            <th scope="col" className="px-4 py-3 text-right">
                              Direct
                            </th>
                            <th scope="col" className="px-4 py-3 text-right">
                              Indirect
                            </th>
                            <th scope="col" className="px-4 py-3 text-right">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50 bg-white">
                          {beneficiaryRows.map((row) => (
                            <tr key={row.key} className="align-middle">
                              <th scope="row" className="px-4 py-3 text-left font-medium text-brand-muted">
                                <span className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: row.color }}
                                  />
                                  {row.label}
                                </span>
                              </th>
                              <td className="px-4 py-3 text-right">
                                <span className="block text-sm font-semibold text-brand-strong">
                                  {row.direct.toLocaleString()}
                                </span>
                                <span className="block text-[10px] uppercase tracking-wide text-brand-soft">
                                  {totalDirect ? Math.round((row.direct / totalDirect) * 100) : 0}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="block text-sm font-semibold text-brand-strong">
                                  {row.indirect.toLocaleString()}
                                </span>
                                <span className="block text-[10px] uppercase tracking-wide text-brand-soft">
                                  {totalIndirect ? Math.round((row.indirect / totalIndirect) * 100) : 0}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="block text-sm font-semibold text-brand-strong">
                                  {(row.direct + row.indirect).toLocaleString()}
                                </span>
                                <span className="block text-[10px] uppercase tracking-wide text-brand-soft">
                                  {totalBeneficiaries
                                    ? Math.round(
                                        ((row.direct + row.indirect) / totalBeneficiaries) * 100
                                      )
                                    : 0}
                                  %
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-5 flex items-center justify-between rounded-lg border border-brand bg-brand-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      <span>Reporting Year</span>
                      <span>{selectedYear}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {isLoading ? (
          <TelegramSectionLoader cardCount={5} />
        ) : (
        <section
          id="project-management"
          className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-strong">Project Management</h2>
                <p className="text-sm text-brand-soft">
                  Track project portfolios, donor coverage, and MEAL documentation readiness.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {projectMetrics.totalProjects} projects
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {projectMetrics.documentCount} documents
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {projectKpiCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">{card.value}</p>
                  {card.helper ? (
                    <p className="mt-1 text-xs text-brand-soft">{card.helper}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-brand bg-brand-soft/30 p-4 md:grid-cols-5">
              {PROJECT_PHASES.map((phase) => {
                const statusCounts = projectMetrics.phasesByKey[phase];
                const totalPhaseCount =
                  statusCounts.not_started + statusCounts.in_progress + statusCounts.completed;
                const completionRate = totalPhaseCount
                  ? Math.round((statusCounts.completed / totalPhaseCount) * 100)
                  : 0;
                return (
                  <div
                    key={phase}
                    className="flex flex-col gap-3 rounded-xl bg-white/90 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-brand-strong">{PHASE_LABELS[phase]}</p>
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                        {totalPhaseCount.toLocaleString()} records
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-brand-soft">
                      {PHASE_STATUS_ORDER.map((status) => (
                        <div key={status} className="flex items-center justify-between">
                          <span>{PHASE_STATUS_LABELS[status]}</span>
                          <span className="font-semibold text-brand-strong">
                            {statusCounts[status].toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="h-2 w-full rounded-full bg-brand-soft">
                      <div
                        className="h-2 rounded-full bg-brand-primary transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                      {completionRate}% complete
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-brand">
              <table className="min-w-full divide-y divide-brand-soft text-sm">
                <thead className="bg-brand-soft text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Project Title
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Donor
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Sector
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Provinces
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Focal Point
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-soft/40 bg-white">
                  {projectShowcase.length ? (
                    projectShowcase.map((project) => (
                      <tr key={project.id}>
                        <td className="px-4 py-3 text-sm font-semibold text-brand-primary">
                          {project.code || "—"}
                        </td>
                        <td className="px-4 py-3 text-brand-strong">{project.name}</td>
                        <td className="px-4 py-3 text-brand-muted">{project.donor ?? "—"}</td>
                        <td className="px-4 py-3 text-brand-muted">{project.sector}</td>
                        <td className="px-4 py-3 text-brand-muted">
                          {project.provinces.length
                            ? project.provinces.slice(0, 3).join(", ")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{project.focalPoint ?? "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-brand-soft" colSpan={6}>
                        Project registry insights will appear once records are added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {isLoading ? (
          <TelegramSectionLoader cardCount={6} />
        ) : (
        <section
          id="monitoring"
          className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-strong">Monitoring</h2>
                <p className="text-sm text-brand-soft">
                  Baseline preparation, enumerator deployment, and monthly narrative tracking.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {monitoringSummary.enumeratorCount} enumerators
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {monitoringSummary.fieldVisitCount} field visits
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {monitoringKpiCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">{card.value}</p>
                  {card.helper ? (
                    <p className="mt-1 text-xs text-brand-soft">{card.helper}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Baseline Survey Status</h3>
                <div className="mt-4 space-y-2 text-xs text-brand-soft">
                  {BASELINE_STATUS_ORDER.map((status) => (
                    <div key={status}>
                      <div className="flex items-center justify-between">
                        <span>{BASELINE_STATUS_LABELS[status]}</span>
                        <span className="font-semibold text-brand-strong">
                          {monitoringSummary.baselineByStatus[status].toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Data Collection Tasks</h3>
                <div className="mt-4 space-y-2 text-xs text-brand-soft">
                  {DATA_COLLECTION_STATUS_ORDER.map((status) => (
                    <div key={status}>
                      <div className="flex items-center justify-between">
                        <span>{DATA_COLLECTION_STATUS_LABELS[status]}</span>
                        <span className="font-semibold text-brand-strong">
                          {monitoringSummary.dataCollectionByStatus[status].toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Monthly Narratives</h3>
                <div className="mt-4 space-y-2 text-xs text-brand-soft">
                  {MONTHLY_STATUS_ORDER.map((status) => (
                    <div key={status}>
                      <div className="flex items-center justify-between">
                        <span>{MONTHLY_STATUS_LABELS[status]}</span>
                        <span className="font-semibold text-brand-strong">
                          {monitoringSummary.monthlyByStatus[status].toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-brand">
              <table className="min-w-full divide-y divide-brand-soft text-sm">
                <thead className="bg-brand-soft text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      Visit Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Location
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Officer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Highlights
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-soft/40 bg-white">
                  {fieldVisitPreview.length ? (
                    fieldVisitPreview.map((visit) => (
                      <tr key={visit.id}>
                        <td className="px-4 py-3 text-brand-muted">
                          {formatDisplayDate(visit.visitDate)}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{visit.location ?? "—"}</td>
                        <td className="px-4 py-3 text-brand-muted">{visit.officer ?? "—"}</td>
                        <td className="px-4 py-3 text-brand-soft">
                          {(visit.positiveFindings ?? visit.negativeFindings ?? "—").slice(0, 90)}
                          {(visit.positiveFindings ?? visit.negativeFindings ?? "").length > 90
                            ? "…"
                            : ""}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-brand-soft" colSpan={4}>
                        Field visit records will populate after monitoring missions are logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {isLoading ? (
          <TelegramSectionLoader cardCount={4} />
        ) : (
        <section
          id="evaluation"
          className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-strong">Evaluation</h2>
                <p className="text-sm text-brand-soft">
                  Monitor third-party evaluations and spotlight programme stories.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {evaluationSummary.totalStories} stories
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {evaluationKpiCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="rounded-2xl border border-brand bg-brand-soft/30 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Stories by Type</h3>
                <div className="mt-4 space-y-3 text-sm text-brand-soft">
                  {STORY_TYPE_ORDER.map((type) => (
                    <div key={type} className="flex items-center justify-between rounded-lg bg-white/90 px-3 py-2 shadow-sm">
                      <span>{STORY_TYPE_LABELS[type]}</span>
                      <span className="font-semibold text-brand-strong">
                        {evaluationSummary.storiesByType[type].toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-brand bg-brand-soft/30 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Spotlight Stories</h3>
                <ul className="mt-4 space-y-4 text-sm text-brand-muted">
                  {evaluationSummary.spotlightStories.length ? (
                    evaluationSummary.spotlightStories.map((story) => (
                      <li key={story.id} className="rounded-xl bg-white/90 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                          <span>{STORY_TYPE_LABELS[story.storyType]}</span>
                          {story.projectId ? (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand-muted">
                              Project #{story.projectId}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-base font-semibold text-brand-strong">{story.title}</p>
                        <p className="mt-1 text-sm text-brand-soft">
                          {(story.summary ?? story.quote ?? "—").slice(0, 140)}
                          {(story.summary ?? story.quote ?? "").length > 140 ? "…" : ""}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl bg-white/90 p-6 text-center text-brand-soft shadow-sm">
                      Upload case studies and success stories to highlight qualitative impact.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
        )}

        {isLoading ? (
          <TelegramSectionLoader cardCount={3} />
        ) : (
        <section
          id="accountability"
          className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-strong">Accountability</h2>
                <p className="text-sm text-brand-soft">
                  Complaint handling and CRM awareness activities by province.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {complaintMetrics.total} complaints logged
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {crmAwareness.length} CRM sessions recorded
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {crmDistrictsCount} districts engaged
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(["open", "inReview", "resolved"] as const).map((key) => {
                const label =
                  key === "open" ? "Open" : key === "inReview" ? "In review" : "Resolved";
                const value = complaintMetrics[key];
                const percentage = complaintMetrics.total
                  ? Math.round((value / complaintMetrics.total) * 100)
                  : 0;
                return (
                  <div key={key} className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-brand-strong">{value}</p>
                    <p className="mt-1 text-xs text-brand-soft">{percentage}% of total cases</p>
                  </div>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border border-brand">
              <table className="min-w-full divide-y divide-brand-soft text-sm">
                <thead className="bg-brand-soft text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      District
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Awareness Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-soft/40 bg-white">
                  {crmAwarenessPreview.length ? (
                    crmAwarenessPreview.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3 text-brand-muted">{record.district ?? "—"}</td>
                        <td className="px-4 py-3 text-brand-muted">
                          {formatDisplayDate(record.awarenessDate)}
                        </td>
                        <td className="px-4 py-3 text-brand-soft">
                          {(record.notes ?? "—").slice(0, 120)}
                          {(record.notes ?? "").length > 120 ? "…" : ""}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-brand-soft" colSpan={3}>
                        CRM community awareness sessions will display once entries are captured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {isLoading ? (
          <TelegramSectionLoader cardCount={3} />
        ) : (
        <section
          id="findings-tracker"
          className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-strong">Findings Tracker</h2>
                <p className="text-sm text-brand-soft">
                  Consolidated learning from monitoring and evaluation activities.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {findingsData.summary.total} findings logged
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {FINDING_SEVERITY_ORDER.map((severity) => (
                <div key={severity} className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    {FINDING_SEVERITY_LABELS[severity]}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">
                    {findingsData.summary.bySeverity[severity].toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {FINDING_STATUS_ORDER.map((status) => (
                <div key={status} className="rounded-2xl border border-brand bg-brand-soft/30 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    {FINDING_STATUS_LABELS[status]}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-brand-strong">
                    {findingsData.summary.byStatus[status].toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-brand">
              <table className="min-w-full divide-y divide-brand-soft text-sm">
                <thead className="bg-brand-soft text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Department
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Severity
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Summary
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-soft/40 bg-white">
                  {findingsPreview.length ? (
                    findingsPreview.map((finding) => (
                      <tr key={finding.id}>
                        <td className="px-4 py-3 text-brand-muted">
                          {finding.findingType === "positive" ? "Positive" : "Negative"}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{finding.department ?? "—"}</td>
                        <td className="px-4 py-3 text-brand-muted">
                          {FINDING_SEVERITY_LABELS[finding.severity]}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">
                          {FINDING_STATUS_LABELS[finding.status]}
                        </td>
                        <td className="px-4 py-3 text-brand-soft">
                          {(finding.description ?? "—").slice(0, 120)}
                          {(finding.description ?? "").length > 120 ? "…" : ""}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-brand-soft" colSpan={5}>
                        Record findings from monitoring, evaluation, and accountability to populate this tracker.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {isLoading ? (
          <TelegramSectionLoader cardCount={4} />
        ) : (
        <section
          id="pdm"
          className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-strong">
                  Post-Distribution Monitoring (PDM)
                </h2>
                <p className="text-sm text-brand-soft">
                  Capture distribution coverage and beneficiary satisfaction indicators.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {pdmSummary.distributionCount} distributions
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {pdmSummary.surveyCount} surveys
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {pdmSummary.reportCount} reports
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {["quality", "quantity", "satisfaction", "protection"].map((key) => (
                <div key={key} className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    {key.charAt(0).toUpperCase() + key.slice(1)} score
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">
                    {pdmSummary.averageScores[key as keyof typeof pdmSummary.averageScores].toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    })}
                  </p>
                  <p className="mt-1 text-xs text-brand-soft">Average across scored surveys</p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-brand">
              <table className="min-w-full divide-y divide-brand-soft text-sm">
                <thead className="bg-brand-soft text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      Assistance Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Distribution Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Location
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      Target Beneficiaries
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-soft/40 bg-white">
                  {distributionsPreview.length ? (
                    distributionsPreview.map((distribution) => (
                      <tr key={distribution.id}>
                        <td className="px-4 py-3 text-brand-muted">{distribution.assistanceType}</td>
                        <td className="px-4 py-3 text-brand-muted">
                          {formatDisplayDate(distribution.distributionDate)}
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{distribution.location ?? "—"}</td>
                        <td className="px-4 py-3 text-brand-muted">
                          {distribution.targetBeneficiaries?.toLocaleString() ?? "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-brand-soft" colSpan={4}>
                        PDM distribution records will display once data collection begins.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {isLoading ? (
          <TelegramSectionLoader cardCount={3} />
        ) : (
        <section
          id="knowledge-hub"
          className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-brand-strong">Knowledge Hub</h2>
                <p className="text-sm text-brand-soft">
                  Lessons learnt, best practices, and shared templates from MEAL activities.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {knowledgeSummary.lessonCount} lessons
                </span>
                <span className="rounded-full bg-brand-soft px-3 py-1">
                  {knowledgeSummary.resourceCount} resources
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Lessons Captured
                </p>
                <p className="mt-2 text-2xl font-semibold text-brand-strong">
                  {knowledgeSummary.lessonCount.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-brand-soft">Learning captured from MEAL cycle</p>
              </div>
              <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Knowledge Resources
                </p>
                <p className="mt-2 text-2xl font-semibold text-brand-strong">
                  {knowledgeSummary.resourceCount.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-brand-soft">Templates, guidance, and standards</p>
              </div>
              <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Themes Covered
                </p>
                <p className="mt-2 text-2xl font-semibold text-brand-strong">
                  {knowledgeSummary.themesCovered.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-brand-soft">Across lessons and resources</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-brand bg-brand-soft/30 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Recent Lessons</h3>
                <ul className="mt-4 space-y-3 text-sm text-brand-muted">
                  {lessonsPreview.length ? (
                    lessonsPreview.map((lesson) => (
                      <li key={lesson.id} className="rounded-xl bg-white/90 p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                          {lesson.source ?? "MEAL"}
                        </p>
                        <p className="mt-1 text-brand-strong">{lesson.lesson}</p>
                        <p className="mt-1 text-xs text-brand-soft">
                          {lesson.department ?? "Cross-department"} • {lesson.theme ?? "General"}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl bg-white/90 p-6 text-center text-brand-soft shadow-sm">
                      Document lessons from monitoring, evaluation, PDM, and CRM learning to populate this view.
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-brand bg-brand-soft/30 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Knowledge Resources</h3>
                <ul className="mt-4 space-y-3 text-sm text-brand-muted">
                  {resourcesPreview.length ? (
                    resourcesPreview.map((resource) => (
                      <li key={resource.id} className="rounded-xl bg-white/90 p-4 shadow-sm">
                        <p className="text-base font-semibold text-brand-strong">{resource.title}</p>
                        <p className="mt-1 text-xs text-brand-soft">
                          {resource.category ?? "Resource"} • {resource.theme ?? "General"}
                        </p>
                        <p className="mt-1 text-sm text-brand-soft">
                          {(resource.description ?? "—").slice(0, 140)}
                          {(resource.description ?? "").length > 140 ? "…" : ""}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl bg-white/90 p-6 text-center text-brand-soft shadow-sm">
                      Upload templates, guidelines, or training content to build the shared knowledge hub.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
        )}

        {isAdmin && (isLoading ? (
          <TelegramSectionLoader cardCount={5} />
        ) : (
          <section
            id="admin-access"
            className="rounded-3xl border border-brand bg-white p-8 shadow-sm"
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-brand-strong">Admin & Access</h2>
                  <p className="text-sm text-brand-soft">
                    Manage user roles, province/project assignments, and connected integrations.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  <span className="rounded-full bg-brand-soft px-3 py-1">
                    {users.length} users
                  </span>
                  <span className="rounded-full bg-brand-soft px-3 py-1">
                    {integrations.length} integrations
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {(["Administrator", "Editor", "Viewer"] as const).map((role) => (
                  <div key={role} className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                      {role}s
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-brand-strong">
                      {(adminSummary.roleCounts[role] ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    Province Assignments
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">
                    {adminSummary.provinceAssignments.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-brand-soft">Role-based provincial permissions</p>
                </div>
                <div className="rounded-2xl border border-brand bg-brand-soft/40 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                    Project Assignments
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-brand-strong">
                    {adminSummary.projectAssignments.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-brand-soft">Project-specific access grants</p>
                </div>
              </div>

              <div className="rounded-2xl border border-brand bg-brand-soft/30 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-brand-strong">Connected Integrations</h3>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  {adminSummary.integrationNames.length ? (
                    adminSummary.integrationNames.map((name) => (
                      <span key={name} className="rounded-full bg-white px-3 py-1 shadow-sm">
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                      Configure Kobo or API integrations to streamline data ingestion.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </main>

      <div className="mx-auto mt-16 flex max-w-7xl justify-center px-3 sm:px-4 md:px-6">
        <button
          type="button"
          onClick={() => setIsReportDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-[#3ea93d] px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-brand-soft transition hover:scale-[1.02]"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5.5 1h5.586L16 5.414V16.5A1.5 1.5 0 0 1 14.5 18h-9A1.5 1.5 0 0 1 4 16.5v-14A1.5 1.5 0 0 1 5.5 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M11 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 11h6M7 14h6M7 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download full PDF report
        </button>
      </div>

      <footer className="bg-white py-3 sm:py-4 text-brand-muted">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm">
          <span className="text-brand-soft text-center sm:text-left w-full sm:w-auto">
            NSDO MEAL MIS Copyright 2025, Developed by Jamshid Khaksaar
            &quot;NSDO-IT Unit&quot;
          </span>
          <div className="flex gap-3 sm:gap-4 font-medium w-full sm:w-auto justify-center sm:justify-end">
            <a
              href="https://nsdo.org.af/contact-us/"
              className="link-brand"
            >
              Contact Us
            </a>
            <a
              href="/about"
              className="link-brand"
            >
              About Us
            </a>
            <a
              href="https://www.nsdo.org.af"
              className="link-brand"
            >
              Home Page
            </a>
          </div>
        </div>
      </footer>

      <ReportDialog
        open={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        defaultYear={selectedYear}
        defaultProjectId={selectedProjectId !== "all" ? selectedProjectId : undefined}
        defaultSector={selectedSector !== ALL_SECTOR_KEY ? selectedSector : undefined}
      />
    </div>
  );
}
