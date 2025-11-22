"use client";

import { useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Sidebar from "@/app/public-dashboard-v2/components/Sidebar";
import TopBar from "@/app/public-dashboard-v2/components/TopBar";
import OverviewSection from "@/app/public-dashboard-v2/components/OverviewSection";
import ProjectsSection from "@/app/public-dashboard-v2/components/ProjectsSection";
import SectorsSection from "@/app/public-dashboard-v2/components/SectorsSection";
import MonitoringSection from "@/app/public-dashboard-v2/components/MonitoringSection";
import EvaluationSection from "@/app/public-dashboard-v2/components/EvaluationSection";
import AccountabilitySection from "@/app/public-dashboard-v2/components/AccountabilitySection";
import FindingsSection from "@/app/public-dashboard-v2/components/FindingsSection";
import KnowledgeSection from "@/app/public-dashboard-v2/components/KnowledgeSection";

export default function PublicDashboardV2() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter State
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [selectedSector, setSelectedSector] = useState<string | undefined>(undefined);

  // Global loading state for dashboard queries
  const isFetching = useIsFetching({ queryKey: ["dashboard"] });

  return (
    <div className="flex h-screen flex-col bg-gray-50 md:flex-row relative">
      {/* Global Loading Overlay */}
      {isFetching > 0 && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/50 backdrop-blur-[2px] transition-all duration-300">
            <div className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-xl ring-1 ring-gray-900/5">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Updating dashboard...</span>
            </div>
        </div>
      )}

      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden md:ml-64">
        <TopBar
            onMenuClick={() => setIsSidebarOpen(true)}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            selectedProvince={selectedProvince}
            onProvinceChange={setSelectedProvince}
            selectedSector={selectedSector}
            onSectorChange={setSelectedSector}
        />

        <main className="flex-1 overflow-y-auto scroll-smooth">
           {activeSection === "overview" && (
               <OverviewSection
                    year={selectedYear}
                    province={selectedProvince}
                    sector={selectedSector}
               />
           )}
           {activeSection === "projects" && (
               <ProjectsSection
                    year={selectedYear}
                    province={selectedProvince}
                    sector={selectedSector}
               />
           )}
           {activeSection === "sectors" && (
               <SectorsSection
                    year={selectedYear}
                    province={selectedProvince}
                    sector={selectedSector}
               />
           )}
           {activeSection === "monitoring" && (
             <MonitoringSection year={selectedYear} province={selectedProvince} sector={selectedSector} />
           )}
           {activeSection === "evaluation" && (
             <EvaluationSection year={selectedYear} province={selectedProvince} sector={selectedSector} />
           )}
           {activeSection === "accountability" && (
             <AccountabilitySection year={selectedYear} province={selectedProvince} sector={selectedSector} />
           )}
           {activeSection === "findings" && (
             <FindingsSection year={selectedYear} province={selectedProvince} sector={selectedSector} />
           )}
           {activeSection === "knowledge" && (
             <KnowledgeSection year={selectedYear} province={selectedProvince} sector={selectedSector} />
           )}
        </main>
      </div>
    </div>
  );
}
