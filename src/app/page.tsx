"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AfghanistanMap from "@/ui/AfghanistanMap";
import BeneficiaryDonut from "@/ui/BeneficiaryDonut";
import {
  ALL_SECTOR_FIELD_ACTIVITY,
  ALL_SECTOR_KEY,
  BENEFICIARY_TYPE_KEYS,
  BENEFICIARY_TYPE_META,
  useDashboardData,
} from "@/context/DashboardDataContext";
import type {
  BeneficiaryBreakdown,
  SectorDetails,
  SectorKey,
} from "@/context/DashboardDataContext";

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
  const { sectors, reportingYears, branding } = useDashboardData();

  const baseSectorKeys = useMemo(
    () => Object.keys(sectors) as SectorKey[],
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

  useEffect(() => {
    if (!reportingYears.length) {
      return;
    }

    if (!reportingYears.includes(selectedYear)) {
      setSelectedYear(reportingYears[reportingYears.length - 1]!);
    }
  }, [reportingYears, selectedYear]);

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

  const beneficiarySlices = useMemo(
    () =>
      displayBeneficiaryRows.map((row) => ({
        label: row.label,
        value: row.value,
        color: row.color,
      })),
    [displayBeneficiaryRows]
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

  const brandDisplayName = branding.companyName?.trim() || "Brand Placeholder";
  const brandLogo = branding.logoDataUrl;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <nav className="bg-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 text-slate-900">
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
                <div className="flex h-16 min-w-[72px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-5">
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-700">
              {brandDisplayName}
            </span>
          </div>

          <div className="hidden flex-1 justify-center text-sm font-medium sm:flex">
            <a
              href="#publish-dashboard"
              className="inline-flex h-11 min-w-[180px] items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-700 shadow-inner transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              Publish Dashboard
            </a>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4 text-sm font-medium text-slate-600">
            <div
              ref={projectsMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setIsProjectsMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isProjectsMenuOpen}
                className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
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
                  className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xl"
                >
                  <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Projects
                  </p>
                  <div className="mt-3 space-y-1">
                    <Link
                      href="/projects"
                      onClick={() => setIsProjectsMenuOpen(false)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <span>Project Registry</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        New
                      </span>
                    </Link>
                    <button
                      type="button"
                      disabled
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-slate-400 transition"
                    >
                      <span>Pipeline Planner</span>
                      <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        Coming soon
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <Link
              href="/user-dashboard"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              Data Entry
            </Link>
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              Admin
            </Link>
            <Link
              href="/complaint-form"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              Complaint Form
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Log In
            </Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <h2 className="text-base font-semibold uppercase tracking-wide text-slate-700">
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
                  className={`relative min-w-[170px] overflow-hidden rounded-full border px-7 py-3 text-base font-semibold text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/25 scale-105"
                      : "border-transparent bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:shadow-md hover:scale-102"
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
          <div className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="min-w-[140px]">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Filters
              </h3>
              <p className="text-sm font-medium text-slate-700">
                Tailor dashboard insights
              </p>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <label className="flex min-w-[180px] flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reporting Year
                </span>
                <div className="relative">
                  <select
                    id="year-filter"
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {reportingYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
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
              <label className="flex min-w-[220px] flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Province Focus
                </span>
                <div className="relative">
                  <select
                    id="province-filter"
                    value={focusedProvince ?? ""}
                    onChange={handleProvinceFilterChange}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
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
              <div className="flex min-w-[220px] flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Beneficiary View
                </span>
                <div className="flex overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setBeneficiaryView("direct")}
                    className={`flex-1 px-4 py-2 text-sm font-semibold transition ${
                      beneficiaryView === "direct"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeneficiaryView("indirect")}
                    className={`flex-1 px-4 py-2 text-sm font-semibold transition ${
                      beneficiaryView === "indirect"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Indirect
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeneficiaryView("total")}
                    className={`flex-1 px-4 py-2 text-sm font-semibold transition ${
                      beneficiaryView === "total"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Total
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8">
            {/* Map Overview */}
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-1 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4">
                <span className="text-base font-semibold uppercase tracking-wide text-slate-700">
                  Afghanistan Provincial Coverage
                </span>
                <p className="text-sm text-slate-500">
                  {selectedSector.toLowerCase()} sector operations • Use filters to focus on specific provinces
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                    Year {selectedYear}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                    {highlightedProvinces.length} Active Province
                    {highlightedProvinces.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center bg-slate-50 p-4">
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

            {/* Beneficiary Donut Chart */}
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold uppercase tracking-wide text-slate-700">
                      Beneficiary Distribution
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedSector} • {selectedYear}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                      Direct {totalDirect.toLocaleString()}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                      Indirect {totalIndirect.toLocaleString()}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                      Total {totalBeneficiaries.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div className="flex flex-1 items-center justify-center">
                  <BeneficiaryDonut
                    data={beneficiarySlices}
                    className="h-64 w-full"
                    title={`${beneficiaryViewLabel} Beneficiaries`}
                    subtitle={`${currentBeneficiaryTotal.toLocaleString()} people across ${highlightedProvinces.length} province${highlightedProvinces.length === 1 ? "" : "s"}`}
                  />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  {displayBeneficiaryRows.map((row) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <span
                        className="inline-flex h-3 w-3 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{row.label}</span>
                        <span className="text-xs text-slate-500">
                          {row.value.toLocaleString()} ·
                          {currentBeneficiaryTotal
                            ? ` ${((row.value / currentBeneficiaryTotal) * 100).toFixed(1)}%`
                            : " 0%"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Sector Overview with Charts */}
        <section className="w-full">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-200 px-8 py-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {selectedSector} Sector Overview
                </h2>
                <p className="text-sm text-slate-500">
                  Snapshot of operating performance and reach • {selectedYear}
                </p>
              </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div
                    className={`text-3xl font-bold ${
                      beneficiaryView === "direct" ? "text-blue-600" : "text-slate-900"
                    }`}
                  >
                    {totalDirect.toLocaleString()}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Direct Beneficiaries
                  </span>
                  <div
                    className={`text-3xl font-bold ${
                      beneficiaryView === "indirect" ? "text-blue-600" : "text-slate-900"
                    }`}
                  >
                    {totalIndirect.toLocaleString()}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Indirect Beneficiaries
                  </span>
                  <div
                    className={`text-3xl font-bold ${
                      beneficiaryView === "total" ? "text-blue-600" : "text-slate-900"
                    }`}
                  >
                    {totalBeneficiaries.toLocaleString()}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Beneficiaries
                  </span>
                </div>
              </div>

            <div className="space-y-8 px-8 py-6">
              {/* Snapshot Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Active Projects
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {sectorDetail.projects}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Running initiatives in {highlightedProvinces.length} province
                    {highlightedProvinces.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Team Deployment
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {sectorDetail.staff}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {highlightedProvinces.length
                      ? `${Math.round(
                          sectorDetail.staff / highlightedProvinces.length
                        )} staff per province on average`
                      : "Awaiting deployment coverage"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Avg. {beneficiaryViewLabel} Beneficiaries / Province
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {highlightedProvinces.length
                      ? Math.round(
                          currentBeneficiaryTotal / highlightedProvinces.length
                        ).toLocaleString()
                      : "0"}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
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
                  <div className="rounded-xl border border-slate-200 px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          Delivery Timeline
                        </h3>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {sectorDetail.start} → {sectorDetail.end}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        65% complete
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "65%" }} />
                      </div>
                      <p className="text-sm text-slate-600">
                        Current focus:{" "}
                        <span className="font-medium">{sectorDetail.fieldActivity}</span>
                      </p>
                    </div>
                  </div>

                  {/* Coverage */}
                  <div className="rounded-xl border border-slate-200 px-6 py-5">
                    <h3 className="text-base font-semibold text-slate-900">
                      Geographic Coverage
                    </h3>
                    <p className="text-sm text-slate-500">
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
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {province}
                        </span>
                      ))}
                    </div>
                    {highlightedProvinces.length > 8 ? (
                      <p className="mt-3 text-xs text-slate-500">
                        +{highlightedProvinces.length - 8} more provinces covered
                      </p>
                    ) : null}
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Coverage Rate</span>
                        <span className="font-semibold text-slate-900">
                          {allProvinces.length
                            ? Math.round(
                                (highlightedProvinces.length / allProvinces.length) * 100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Projects / Province</span>
                        <span className="font-semibold text-slate-900">
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
                  <div className="rounded-xl border border-slate-200 px-6 py-5">
                    <h3 className="text-base font-semibold text-slate-900">
                      Human Resources
                    </h3>
                    <p className="text-sm text-slate-500">
                      Deployment mix for on-ground and coordination teams.
                    </p>
                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Field Staff</span>
                          <span className="font-semibold text-slate-900">
                            {Math.floor(sectorDetail.staff * 0.7)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: "70%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Admin Staff</span>
                          <span className="font-semibold text-slate-900">
                            {Math.floor(sectorDetail.staff * 0.3)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-emerald-300" style={{ width: "30%" }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-600">Total Team</span>
                        <span className="font-semibold text-slate-900">{sectorDetail.staff}</span>
                      </div>
                    </div>
                  </div>

                  {/* Beneficiaries */}
                  <div className="rounded-xl border border-slate-200 px-6 py-5">
                    <h3 className="text-base font-semibold text-slate-900">
                      Beneficiary Breakdown
                    </h3>
                    <p className="text-sm text-slate-500">
                      Distribution across demographic segments for the active year.
                    </p>
                    <div className="mt-5 space-y-2 text-sm">
                      {beneficiaryRows.map((row) => (
                        <div
                          key={row.key}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="font-medium text-slate-700">{row.label}</span>
                          </div>
                          <div className="flex items-center gap-6 text-xs uppercase tracking-wide text-slate-500">
                            <div className="flex flex-col items-end gap-0.5">
                              <span>Direct</span>
                              <span className="text-sm font-semibold text-slate-900 leading-none">
                                {row.direct.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 leading-tight">
                                {totalDirect
                                  ? Math.round((row.direct / totalDirect) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <span>Indirect</span>
                              <span className="text-sm font-semibold text-slate-900 leading-none">
                                {row.indirect.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 leading-tight">
                                {totalIndirect
                                  ? Math.round((row.indirect / totalIndirect) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <span>Total</span>
                              <span className="text-sm font-semibold text-slate-900 leading-none">
                                {(row.direct + row.indirect).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 leading-tight">
                                {totalBeneficiaries
                                  ? Math.round(
                                      ((row.direct + row.indirect) / totalBeneficiaries) * 100
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
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

      <footer className="bg-white py-4 text-slate-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-sm">
          <span className="text-slate-500">
            NSDO MEAL MIS Copyright 2025, Developed by Jamshid Khaksaar
            &quot;NSDO-IT Unit&quot;
          </span>
          <div className="flex gap-4 font-medium">
            <a
              href="#contact"
              className="transition hover:text-slate-900"
            >
              Contact Us
            </a>
            <a
              href="#about"
              className="transition hover:text-slate-900"
            >
              About Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
