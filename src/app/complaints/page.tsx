"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/context/DashboardDataContext";
import Loading from "@/app/loading";
import { ComplaintList } from "./(components)/ComplaintList";
import { ComplaintDetails } from "./(components)/ComplaintDetails";
import { ComplaintRecord } from "@/lib/dashboard-data";

export default function ComplaintsPage() {
  const router = useRouter();
  const { complaints, branding, isLoading, updateComplaint } = useDashboardData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (isMounted) {
          setIsAuthenticated(response.ok);
        }
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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors; navigation will close the session client-side.
    } finally {
      window.location.href = "/";
    }
  };

  const brandDisplayName = branding.companyName?.trim() || "Brand Portal";
  const brandLogo = branding.logoUrl;
  const orderedComplaints = useMemo(
    () =>
      [...complaints].sort((a, b) => {
        const dateA = Number(new Date(a.submittedAt));
        const dateB = Number(new Date(b.submittedAt));
        if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
          return b.submittedAt.localeCompare(a.submittedAt);
        }
        return dateB - dateA;
      }),
    [complaints]
  );

  useEffect(() => {
    if (!selectedComplaintId && orderedComplaints.length) {
      setSelectedComplaintId(orderedComplaints[0]!.id);
    }
  }, [orderedComplaints, selectedComplaintId]);

  const selectedComplaint = selectedComplaintId
    ? orderedComplaints.find((complaint) => complaint.id === selectedComplaintId) ?? null
    : null;

  const handleUpdateComplaint = async (id: string, updates: Partial<ComplaintRecord>) => {
    await updateComplaint(id, updates);
  };

  if (isSigningOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-soft px-6 py-12 text-brand-strong">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-12 w-12 animate-spin text-brand-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-lg font-semibold tracking-tight">Signing out...</p>
        </div>
      </div>
    );
  }

  if (!hasCheckedAuth || (isLoading && complaints.length === 0)) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-soft text-brand-strong">
      <header className="border-b border-brand bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
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
              <p className="text-xs uppercase tracking-wide text-brand-soft">Internal workspace</p>
              <h1 className="text-xl font-semibold text-brand-strong">
                {brandDisplayName} Complaints
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-brand-muted">
            <Link href="/" className="rounded-full px-4 py-2 chip-brand">
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              className="rounded-full px-4 py-2 text-white btn-brand"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
        <section className="space-y-5 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand pb-5">
            <div>
              <h2 className="text-lg font-semibold text-brand-strong">Complaint Inbox</h2>
              <p className="text-sm text-brand-soft">
                Review submissions collected through the public MIS complaint form.
              </p>
            </div>
            <Link
              href="/complaint-form"
              className="rounded-full px-4 py-2 text-sm font-medium chip-brand"
            >
              Open Complaint Form
            </Link>
          </div>

          {orderedComplaints.length ? (
            <div className="flex min-h-[520px] rounded-xl border border-brand bg-brand-soft/40">
              <ComplaintList
                complaints={orderedComplaints}
                selectedComplaintId={selectedComplaintId}
                onSelectComplaint={setSelectedComplaintId}
              />
              <ComplaintDetails
                complaint={selectedComplaint}
                onUpdateComplaint={handleUpdateComplaint}
              />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-brand-soft">
              No complaints have been received yet. New submissions will appear here instantly.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
