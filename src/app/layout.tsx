import type { Metadata } from "next";
import "./globals.css";
import "./nav-overrides.css";
import { DashboardDataProvider } from "@/context/DashboardDataContext";
import BrandingHead from "@/ui/BrandingHead";
import AppFooter from "@/app/components/app-footer";

export const metadata: Metadata = {
  title: "MIS NSDO",
  description: "Application workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <DashboardDataProvider>
          <BrandingHead />
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <AppFooter />
          </div>
        </DashboardDataProvider>
      </body>
    </html>
  );
}
