import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming a utility for class merging exists, or I will create one
import {
  LayoutDashboard,
  PieChart,
  FolderKanban,
  Activity,
  FileText,
  AlertCircle,
  Search,
  BookOpen,
  Menu,
  X
} from "lucide-react";

type SidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sectors", label: "Sectors", icon: PieChart },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "evaluation", label: "Evaluation", icon: FileText },
  { id: "accountability", label: "Accountability", icon: AlertCircle },
  { id: "findings", label: "Findings / PDM", icon: Search },
  { id: "knowledge", label: "Knowledge Hub", icon: BookOpen },
];

export default function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  const [branding, setBranding] = useState<{ companyName: string; logoUrl: string | null }>({
    companyName: "NSDO MIS",
    logoUrl: null,
  });

  useEffect(() => {
    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        setBranding({
          companyName: data.companyName ?? "NSDO MIS",
          logoUrl: data.logoUrl ?? null,
        });
      })
      .catch(() => {
        // ignore branding fetch errors
      });
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center gap-3 border-b px-6">
           {branding.logoUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img
               src={branding.logoUrl}
               alt={`${branding.companyName} logo`}
               className="h-12 w-auto max-w-[8rem] object-contain"
             />
           ) : (
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
               <span className="text-sm font-bold">{branding.companyName.slice(0, 2).toUpperCase()}</span>
             </div>
           )}
           
           <div className="flex flex-col justify-center">
             <h2 className="text-base font-bold leading-tight text-gray-900">
               {branding.companyName}
             </h2>
             <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
               Monitoring System
             </p>
           </div>

           <button onClick={onClose} className="ml-auto md:hidden p-1 rounded-md hover:bg-gray-100">
             <X className="h-5 w-5 text-gray-500" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {SECTIONS.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    onClose(); // Close sidebar on mobile selection
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-emerald-600" : "text-gray-400")} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t p-4">
            <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-xs font-medium text-emerald-800">Public Dashboard v2.0</p>
                <p className="text-[10px] text-emerald-600 mt-1">Beta Release</p>
            </div>
        </div>
      </aside>
    </>
  );
}
