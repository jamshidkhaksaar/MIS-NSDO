"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AfghanistanMap from "@/ui/AfghanistanMap";
import BeneficiaryDonut from "@/ui/BeneficiaryDonut";
import { useDashboardData } from "@/context/DashboardDataContext";
import {
  ALL_SECTOR_FIELD_ACTIVITY,
  ALL_SECTOR_KEY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
} from "@/lib/dashboard-data";
import type {
  BeneficiaryBreakdown,
  SectorDetails,
  SectorKey,
} from "@/context/DashboardDataContext";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import Loading from "./loading";

type DashboardSectorKey = SectorKey | typeof ALL_SECTOR_KEY;

type SectorSnapshot = {
  provinces: string[];
  beneficiaries: BeneficiaryBreakdown;
};

type SectorSnapshotMap = Record<DashboardSectorKey, SectorSnapshot>;
type SectorDetailMap = Record<DashboardSectorKey, SectorDetails>;

const DEFAULT_START_LABEL = "Start date";
const DEFAULT_END_LABEL = "End date";

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

export default function Home() {
  const { sectors, reportingYears, branding, isLoading, projects } = useDashboardData();

  const baseSectorKeys = useMemo(
    () =>
      Object.keys(sectors)
        .filter((key) => key !== ALL_SECTOR_KEY) as SectorKey[],
    [sectors]
  );

  const [selectedSector, setSelectedSector] =
    useState<DashboardSectorKey>(ALL_SECTOR_KEY);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (reportingYears.length) {
      return reportingYears[reportingYears.length - 1]!;
    }
    return new Date().getFullYear();
  });
  const [beneficiaryView, setBeneficiaryView] =
    useState<"direct" | "indirect" | "total">("direct");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isBootstrapLoading = isLoading && baseSectorKeys.length === 0;

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
    if (typeof window === "undefined") {
      return;
    }

    const syncAuthState = () => {
      const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
      setIsAuthenticated(storedValue === "true");
    };

    syncAuthState();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsProjectsMenuOpen(false);
    }
  }, [isAuthenticated]);

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
    if (!baseSectorKeys.length) {
      return {
        allProvinces: [],
        sectorSnapshots: {
          [ALL_SECTOR_KEY]: {
            provinces: [],
            beneficiaries: createEmptyBreakdown(),
          },
        } as SectorSnapshotMap,
        sectorDetails: {
          [ALL_SECTOR_KEY]: {
            provinces: [],
            beneficiaries: createEmptyBreakdown(),
            projects: 0,
            start: DEFAULT_START_LABEL,
            end: DEFAULT_END_LABEL,
            fieldActivity: ALL_SECTOR_FIELD_ACTIVITY,
            staff: 0,
          },
        } as SectorDetailMap,
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
  }, [baseSectorKeys, sectors]);

  const [focusedProvince, setFocusedProvince] = useState<string | null>(null);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);
  const projectsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const availableProvinces = sectorSnapshots[selectedSector]?.provinces ?? [];
    if (focusedProvince && !availableProvinces.includes(focusedProvince)) {
      setFocusedProvince(null);
    }
  }, [focusedProvince, sectorSnapshots, selectedSector]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectsMenuRef.current &&
        !projectsMenuRef.current.contains(event.target as Node)
      ) {
        setIsProjectsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProjectsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSectorClick = (sector: DashboardSectorKey) => {
    if (sector === selectedSector) {
      return;
    }
    setSelectedSector(sector);
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

  const handleSignOut = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setIsAuthenticated(false);
  }, []);

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

  const projectStatusCounts = useMemo(() => {
    if (!projects.length) {
      return { active: 0, ongoing: 0, completed: 0 };
    }

    const nowTime = Date.now();

    return projects.reduce(
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
  }, [projects]);

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
    <div className="flex min-h-screen flex-col text-brand-strong">
      <nav className="sticky top-0 z-40 border-b border-brand bg-white/90 backdrop-blur-md shadow-brand-soft">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 text-brand-strong">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-16 items-center">
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogo}
                  alt="Organisation logo"
                  className="max-h-16 w-auto object-contain"
                />
              ) : (
                <div className="flex h-16 min-w-[72px] items-center justify-center rounded-xl border border-brand bg-brand-soft px-5">
                  <span className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold tracking-tight text-brand-muted">
              {brandDisplayName}
            </span>
          </div>

          <div className="hidden flex-1 justify-center text-sm font-medium sm:flex">
            <a
              href="#publish-dashboard"
              className="inline-flex h-11 min-w-[180px] items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold chip-brand-soft"
            >
              Publish Dashboard
            </a>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4 text-sm font-medium text-brand-muted">
            {isAuthenticated ? (
              <>
                <div
                  ref={projectsMenuRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => setIsProjectsMenuOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={isProjectsMenuOpen}
                    className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold chip-brand"
                  >
                    <span>Projects</span>
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
                <Link
                  href="/user-dashboard"
                  className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold chip-brand"
                >
                  Data Entry
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold chip-brand"
                >
                  Admin
                </Link>
              </>
            ) : null}
            <Link
              href="/complaint-form"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold chip-brand"
            >
              Complaint Form
            </Link>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
              >
                Log Out
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="border-b border-brand bg-brand-soft">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <h2 className="text-base font-semibold uppercase tracking-wide text-brand-primary">
            Working Sectors
          </h2>
          <div className="flex flex-wrap flex-row-reverse items-center justify-end gap-4">
            {sectorOrder.map((sector) => {
              const isActive = selectedSector === sector;
              return (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleSectorClick(sector)}
                  aria-pressed={isActive}
                  className={`relative min-w-[170px] overflow-hidden rounded-full px-7 py-3 text-base font-semibold text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3ea93d] ${
                    isActive
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

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
        {/* Dashboard Grid Section */}
        <section
          className="flex flex-col gap-6"
          id="publish-dashboard"
        >
          <div className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-brand bg-white p-4 shadow-sm">
            <div className="min-w-[140px]">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft">
                Filters
              </h3>
              <p className="text-sm font-medium text-brand-muted">
                Tailor dashboard insights
              </p>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <label className="flex min-w-[180px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Reporting Year
                </span>
                <div className="relative">
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="input-brand w-full appearance-none rounded-lg px-4 py-2 text-sm font-medium"
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
              <label className="flex min-w-[220px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Province Focus
                </span>
                <div className="relative">
                  <select
                    id="province-filter"
                    value={focusedProvince ?? ""}
                    onChange={handleProvinceFilterChange}
                    className="input-brand w-full appearance-none rounded-lg px-4 py-2 text-sm font-medium"
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
              <div className="flex min-w-[220px] flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  Beneficiary View
                </span>
                <div className="flex overflow-hidden rounded-full border border-brand bg-brand-soft">
                  <button
                    type="button"
                    onClick={() => setBeneficiaryView("direct")}
                    className={`flex-1 px-4 py-2 text-sm font-semibold ${
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
                    className={`flex-1 px-4 py-2 text-sm font-semibold ${
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
                    className={`flex-1 px-4 py-2 text-sm font-semibold ${
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8">
            <div className="space-y-6">
              {/* Map Overview */}
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

              {/* Project Status */}
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
            </div>

            {/* Beneficiary Donut Chart */}
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
          </div>
        </section>

        {/* Full-Width Sector Overview with Charts */}
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
      </main>

      <footer className="bg-white py-4 text-brand-muted">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-sm">
          <span className="text-brand-soft">
            NSDO MEAL MIS Copyright 2025, Developed by Jamshid Khaksaar
            &quot;NSDO-IT Unit&quot;
          </span>
          <div className="flex gap-4 font-medium">
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
    </div>
  );
}
