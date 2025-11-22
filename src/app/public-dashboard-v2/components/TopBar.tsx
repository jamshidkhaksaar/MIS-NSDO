import { Menu, LogIn, LogOut, Shield, MessageCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type AvailableFilters } from "@/lib/api/dashboard-v2";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TopBarProps = {
  onMenuClick: () => void;
  selectedYear?: number;
  onYearChange: (year: number | undefined) => void;
  selectedProvince?: string;
  onProvinceChange: (province: string | undefined) => void;
  selectedSector?: string;
  onSectorChange: (sector: string | undefined) => void;
};

function fetchFilters() {
    return fetch("/api/v2/dashboard/filters").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch filters");
        return res.json() as Promise<AvailableFilters>;
    });
}

function fetchSession() {
    return fetch("/api/auth/session").then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ user?: { role?: string } }>;
    });
}

export default function TopBar({
    onMenuClick,
    selectedYear,
  onYearChange,
  selectedProvince,
  onProvinceChange,
  selectedSector,
  onSectorChange
}: TopBarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [branding, setBranding] = useState<{ companyName: string; logoUrl: string | null; faviconUrl: string | null }>({
    companyName: "NSDO MIS",
    logoUrl: null,
    faviconUrl: null,
  });

  const { data: filters } = useQuery({
      queryKey: ["dashboard", "filters"],
      queryFn: fetchFilters
  });

  const { data: session } = useQuery({
      queryKey: ["auth", "session"],
      queryFn: fetchSession
  });

  const isAuthenticated = Boolean(session?.user);
  const isAdmin = session?.user?.role === "Administrator";

  useEffect(() => {
    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        setBranding({
          companyName: data.companyName ?? "NSDO MIS",
          logoUrl: data.logoUrl ?? null,
          faviconUrl: data.faviconUrl ?? null,
        });
        if (data.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = data.faviconUrl;
        }
      })
      .catch(() => {
        // ignore branding fetch errors to avoid blocking UI
      });
  }, []);

  const brandMark = useMemo(() => {
    if (branding.logoUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={`${branding.companyName} logo`}
          className="h-10 w-auto object-contain"
        />
      );
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
        {branding.companyName.slice(0, 2).toUpperCase()}
      </div>
    );
  }, [branding.companyName, branding.logoUrl]);

  const handleLogout = async () => {
      try {
          await fetch("/api/auth/logout", { method: "POST" });
          await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
          router.refresh();
          window.location.href = "/";
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden md:flex md:flex-col">
          <h1 className="text-lg font-semibold text-gray-900">Public Dashboard</h1>
          <p className="text-xs text-gray-500">Monitoring, Evaluation, Accountability & Learning</p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 md:flex">
           <select
                className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={selectedSector ?? ""}
                onChange={(e) => onSectorChange(e.target.value || undefined)}
           >
               <option value="">All Sectors</option>
               <optgroup label="Main Sectors">
                 {filters?.mainSectors.map(sector => (
                   <option key={`main-${sector.id}`} value={sector.name}>{sector.name}</option>
                 ))}
               </optgroup>
               <optgroup label="Sub-sectors">
                 {filters?.subSectors.map(sub => (
                   <option key={`sub-${sub.id}`} value={sub.name}>{sub.mainSectorName ? `${sub.mainSectorName} • ${sub.name}` : sub.name}</option>
                 ))}
               </optgroup>
            </select>
           <select
                className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={selectedYear ?? ""}
                onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
           >
               <option value="">All Years</option>
               {filters?.years.map(year => (
                   <option key={year} value={year}>{year}</option>
               ))}
           </select>
           <select
                className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={selectedProvince ?? ""}
                onChange={(e) => onProvinceChange(e.target.value || undefined)}
           >
               <option value="">All Provinces</option>
               {filters?.provinces.map(province => (
                   <option key={province} value={province}>{province}</option>
               ))}
           </select>
        </div>

        {isAuthenticated && (
          <div className="relative">
            <button
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200"
              onClick={() => {
                setIsProjectsOpen((open) => !open);
                setIsDataEntryOpen(false);
              }}
            >
              Projects
              <span className="text-gray-500">▼</span>
            </button>
            {isProjectsOpen && (
              <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Projects</p>
                <div className="mt-2 space-y-1 text-sm">
                  <Link href="/projects/registered" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                    Registered Projects
                  </Link>
                  <Link href="/projects/catalog-modifier" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                    Cluster &amp; Sector Modifier
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthenticated && (
          <div className="relative">
            <button
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200"
              onClick={() => {
                setIsDataEntryOpen((open) => !open);
                setIsProjectsOpen(false);
              }}
            >
              Data Entry
              <span className="text-gray-500">▼</span>
            </button>
            {isDataEntryOpen && (
              <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Data Entry</p>
                <div className="mt-2 space-y-1 text-sm">
                  <Link href="/data-entry/monitoring" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                    Monitoring
                  </Link>
                  <Link href="/data-entry/evaluation" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                    Evaluation
                  </Link>
                  <Link href="/data-entry/beneficiaries" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                    Beneficiaries
                  </Link>
                  <Link href="/data-entry/accountability" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                    Accountability
                  </Link>
                  <Link href="/data-entry/lesson-learns" className="block rounded-lg px-3 py-2 hover:bg-gray-50">
                    Lesson Learns
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthenticated && (
          <Link
            href="/complaints"
            className="hidden sm:inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium hover:bg-gray-200"
          >
            Complaints
          </Link>
        )}

        {isAuthenticated && isAdmin && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            <Shield className="h-3.5 w-3.5" />
            Admin
          </Link>
        )}

        <Link
          href="/complaint-form"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <MessageCircle className="h-4 w-4" />
          Complaint Form
        </Link>

        {session?.user ? (
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <LogIn className="h-3.5 w-3.5" />
            Log In
          </Link>
        )}
      </div>
    </header>
  );
}
