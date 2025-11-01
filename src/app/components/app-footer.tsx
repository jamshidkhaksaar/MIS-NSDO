'use client';

import { useDashboardData } from "@/context/DashboardDataContext";
import { APP_VERSION } from "@/lib/version";

export default function AppFooter() {
  const { branding } = useDashboardData();
  const organisation = branding.companyName?.trim() || "NSDO";

  return (
    <footer className="border-t border-brand/20 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-4 text-xs text-brand-soft sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-brand-muted">{organisation} Management Information System</span>
        <span className="tracking-wide">Version {APP_VERSION}</span>
      </div>
    </footer>
  );
}
