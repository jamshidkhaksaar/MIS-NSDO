import type { Metadata } from "next";
import "./globals.css";
import "./nav-overrides.css";
import { Providers } from "./public-dashboard-v2/providers";

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
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
