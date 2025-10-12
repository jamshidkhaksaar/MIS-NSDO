import type { Metadata } from "next";
import "./globals.css";
import { DashboardDataProvider } from "@/context/DashboardDataContext";
import BrandingHead from "@/ui/BrandingHead";

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
      <body>
        <DashboardDataProvider>
          <BrandingHead />
          {children}
        </DashboardDataProvider>
      </body>
    </html>
  );
}
