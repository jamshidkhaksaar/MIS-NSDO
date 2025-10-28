"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Loading from "@/app/loading";
import { useDashboardData } from "@/context/DashboardDataContext";

const NAV_LINKS = [
  { href: "/projects", label: "Projects Home" },
  { href: "/projects/new", label: "Add Project" },
  { href: "/projects/catalog-modifier", label: "Cluster & Sector Modifier" },
];

type ProjectsShellProps = {
  children: ReactNode;
};

export default function ProjectsShell({ children }: ProjectsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { branding } = useDashboardData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!isMounted) {
          return;
        }
        setIsAuthenticated(response.ok);
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setHasCheckedAuth(true);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasCheckedAuth && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasCheckedAuth, isAuthenticated, router]);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors; navigation will close the session client-side.
    } finally {
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const brandDisplayName = useMemo(
    () => branding.companyName?.trim() || "Project Workspace",
    [branding.companyName]
  );
  const brandLogo = branding.logoDataUrl;

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  if (!hasCheckedAuth) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-soft text-brand-strong">
      <header className="border-b border-brand bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 items-center">
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogo}
                  alt="Organisation logo"
                  className="max-h-12 w-auto object-contain"
                />
              ) : (
                <div className="flex h-12 min-w-[64px] items-center justify-center rounded-xl border border-brand bg-brand-soft px-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-soft">Project workspace</p>
              <h1 className="text-xl font-semibold text-brand-strong">{brandDisplayName}</h1>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-brand-muted">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 transition ${
                    isActive ? "btn-brand text-white" : "chip-brand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              className="rounded-full px-4 py-2 text-white btn-brand"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-brand bg-white py-4 text-sm text-brand-muted">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-6">
          <span>&copy; {currentYear} {brandDisplayName}</span>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="hover:text-brand-primary transition">
              Dashboard
            </Link>
            <Link href="/projects" className="hover:text-brand-primary transition">
              Projects
            </Link>
            <Link href="/complaints" className="hover:text-brand-primary transition">
              Complaints
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
