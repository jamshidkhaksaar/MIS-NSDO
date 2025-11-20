import { Menu, Moon, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type AvailableFilters } from "@/lib/api/dashboard-v2";

type TopBarProps = {
  onMenuClick: () => void;
  selectedYear?: number;
  onYearChange: (year: number | undefined) => void;
  selectedProvince?: string;
  onProvinceChange: (province: string | undefined) => void;
};

function fetchFilters() {
    return fetch("/api/v2/dashboard/filters").then((res) => {
        if (!res.ok) throw new Error("Failed to fetch filters");
        return res.json() as Promise<AvailableFilters>;
    });
}

export default function TopBar({
    onMenuClick,
    selectedYear,
    onYearChange,
    selectedProvince,
    onProvinceChange
}: TopBarProps) {

  const { data: filters } = useQuery({
      queryKey: ["dashboard", "filters"],
      queryFn: fetchFilters
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
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

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
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

        <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <span className="sr-only">Toggle theme</span>
            <Sun className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
