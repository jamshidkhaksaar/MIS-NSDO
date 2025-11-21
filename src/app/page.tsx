"use client";

import { useState } from "react";
import Sidebar from "@/app/public-dashboard-v2/components/Sidebar";
import TopBar from "@/app/public-dashboard-v2/components/TopBar";
import OverviewSection from "@/app/public-dashboard-v2/components/OverviewSection";
import ProjectsSection from "@/app/public-dashboard-v2/components/ProjectsSection";
import SectorsSection from "@/app/public-dashboard-v2/components/SectorsSection";

export default function PublicDashboardV2() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter State
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);

  return (
    <div className="flex h-screen flex-col bg-gray-50 md:flex-row">
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
        />
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
           {activeSection === "overview" && (
               <OverviewSection
                    year={selectedYear}
                    province={selectedProvince}
               />
           )}
           {activeSection === "projects" && (
               <ProjectsSection
                    year={selectedYear}
                    province={selectedProvince}
               />
           )}
           {activeSection === "sectors" && (
               <SectorsSection
                    year={selectedYear}
                    province={selectedProvince}
               />
           )}
           {activeSection !== "overview" && activeSection !== "projects" && activeSection !== "sectors" && (
             <div className="flex h-full items-center justify-center text-gray-500">
                <div className="text-center">
                   <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                   <p>The {activeSection} section is under development.</p>
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
}
