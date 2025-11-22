"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import OverviewSection from "./components/OverviewSection";
import ProjectsSection from "./components/ProjectsSection";
import SectorsSection from "./components/SectorsSection";
import MonitoringSection from "./components/MonitoringSection";
import EvaluationSection from "./components/EvaluationSection";
import AccountabilitySection from "./components/AccountabilitySection";
import FindingsSection from "./components/FindingsSection";
import KnowledgeSection from "./components/KnowledgeSection";

export default function PublicDashboardV2() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter State
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined);
  const [selectedSector, setSelectedSector] = useState<string | undefined>(undefined);

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
