import { DashboardDataProvider } from "@/context/DashboardDataContext";
import BrandingHead from "@/ui/BrandingHead";
import AppFooter from "@/app/components/app-footer";
import CookieBanner from "@/app/components/CookieBanner";

export default function LegacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardDataProvider>
      <BrandingHead />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <AppFooter />
      </div>
      <CookieBanner />
    </DashboardDataProvider>
  );
}
