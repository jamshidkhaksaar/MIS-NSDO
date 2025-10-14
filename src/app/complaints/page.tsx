"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/context/DashboardDataContext";
import Loading from "@/app/loading";

type ComplaintStatus = "pending" | "reviewed" | "completed";

const STATUS_OPTIONS: Array<{
  value: ComplaintStatus;
  label: string;
  tooltip: string;
}> = [
  {
    value: "pending",
    label: "Pending",
    tooltip: "Track while awaiting review or action.",
  },
  {
    value: "reviewed",
    label: "Reviewed",
    tooltip: "Document that MEAL has reviewed this complaint.",
  },
  {
    value: "completed",
    label: "Completed",
    tooltip: "Mark the complaint as fully actioned.",
  },
];

type ComplaintLocalState = {
  isRead: boolean;
  isFollowing: boolean;
  status: ComplaintStatus;
};

export default function ComplaintsPage() {
  const router = useRouter();
  const { complaints, branding, isLoading } = useDashboardData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [complaintState, setComplaintState] = useState<Record<string, ComplaintLocalState>>({});

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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors; navigation will close the session client-side.
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const brandDisplayName = branding.companyName?.trim() || "Brand Portal";
  const brandLogo = branding.logoDataUrl;
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
    setComplaintState((previous) => {
      const next: Record<string, ComplaintLocalState> = {};
      orderedComplaints.forEach((complaint) => {
        next[complaint.id] =
          previous[complaint.id] ?? {
            isRead: false,
            isFollowing: false,
            status: "pending",
          };
      });
      return next;
    });
  }, [orderedComplaints]);

  useEffect(() => {
    if (!selectedComplaintId && orderedComplaints.length) {
      setSelectedComplaintId(orderedComplaints[0]!.id);
    }
  }, [orderedComplaints, selectedComplaintId]);

  const selectedComplaint = selectedComplaintId
    ? orderedComplaints.find((complaint) => complaint.id === selectedComplaintId) ?? null
    : null;

  const selectedComplaintState = selectedComplaint
    ? complaintState[selectedComplaint.id]
    : undefined;
  const selectedStatus = selectedComplaintState?.status ?? "pending";
  const selectedStatusLabel =
    STATUS_OPTIONS.find((status) => status.value === selectedStatus)?.label ?? "Pending";
  const isSelectedComplaintUnread = !(selectedComplaintState?.isRead ?? false);
  const isSelectedComplaintFollowing = selectedComplaintState?.isFollowing ?? false;

  const complaintMetrics = useMemo(() => {
    const aggregates = {
      total: orderedComplaints.length,
      following: 0,
      pending: 0,
      reviewed: 0,
      completed: 0,
    };

    orderedComplaints.forEach((complaint) => {
      const state = complaintState[complaint.id];
      if (state?.isFollowing) {
        aggregates.following += 1;
      }

      const status = state?.status ?? "pending";
      if (status === "pending") {
        aggregates.pending += 1;
      } else if (status === "reviewed") {
        aggregates.reviewed += 1;
      } else if (status === "completed") {
        aggregates.completed += 1;
      }
    });

    return aggregates;
  }, [complaintState, orderedComplaints]);

  const getStatusBadgeStyles = (status: ComplaintStatus) => {
    switch (status) {
      case "reviewed":
        return "border border-brand bg-white text-brand-muted";
      case "completed":
        return "border border-emerald-300 bg-emerald-50 text-emerald-700";
      case "pending":
      default:
        return "border border-amber-300 bg-amber-50 text-amber-700";
    }
  };

  useEffect(() => {
    if (!selectedComplaintId) {
      return;
    }
    setComplaintState((previous) => {
      const current = previous[selectedComplaintId];
      if (!current || current.isRead) {
        return previous;
      }
      return {
        ...previous,
        [selectedComplaintId]: {
          ...current,
          isRead: true,
        },
      };
    });
  }, [selectedComplaintId]);

  const updateComplaintState = (complaintId: string, updates: Partial<ComplaintLocalState>) => {
    setComplaintState((previous) => {
      const current = previous[complaintId] ?? {
        isRead: false,
        isFollowing: false,
        status: "pending",
      };
      return {
        ...previous,
        [complaintId]: {
          ...current,
          ...updates,
        },
      };
    });
  };

  if (!hasCheckedAuth || (isLoading && complaints.length === 0)) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-soft text-brand-strong">
      <header className="border-b border-brand bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <section className="space-y-5 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
          <div className="grid gap-3 rounded-2xl border border-brand bg-brand-soft px-4 py-4 text-sm text-brand-muted sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                Total Complaints
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand-strong">{complaintMetrics.total}</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                Following
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand-strong">
                {complaintMetrics.following}
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                Pending
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">{complaintMetrics.pending}</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                Completed
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                {complaintMetrics.completed}
              </p>
            </div>
          </div>
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
              <aside className="flex w-full max-w-xs flex-1 flex-col border-r border-brand/70 bg-white/90">
                <div className="flex items-center justify-between border-b border-brand px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                  <span>Inbox</span>
                  <span className="rounded-full border border-brand px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                    {orderedComplaints.length}
                  </span>
                </div>
                <ul className="flex-1 overflow-y-auto">
                  {orderedComplaints.map((complaint) => {
                    const submittedDate = new Date(complaint.submittedAt);
                    const readableDate = Number.isNaN(submittedDate.getTime())
                      ? complaint.submittedAt
                      : submittedDate.toLocaleString();
                    const state = complaintState[complaint.id];
                    const isActive = selectedComplaintId === complaint.id;
                    const isUnread = !(state?.isRead ?? false);
                    const isFollowing = state?.isFollowing ?? false;
                    const status = (state?.status ?? "pending") as ComplaintStatus;
                    const statusLabel =
                      STATUS_OPTIONS.find((statusOption) => statusOption.value === status)?.label ??
                      "Pending";
                    const statusStyles = getStatusBadgeStyles(status);
                    return (
                      <li key={complaint.id} className="border-b border-brand/40 last:border-b-0">
                        <button
                          type="button"
                          title={`Open complaint from ${complaint.fullName}`}
                          onClick={() => setSelectedComplaintId(complaint.id)}
                          className={`flex w-full flex-col gap-2 px-4 py-4 text-left transition ${
                            isActive ? "bg-brand-soft/80" : "hover:bg-brand-soft/60"
                          }`}
                          aria-current={isActive ? "true" : undefined}
                        >
                          <div className="flex items-center gap-2">
                            {isUnread ? (
                              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-transparent" aria-hidden />
                            )}
                            <p
                              className={`break-words text-sm font-semibold ${
                                isUnread ? "text-brand-strong" : "text-brand-muted"
                              }`}
                            >
                              {complaint.fullName}
                            </p>
                            {isFollowing ? (
                              <span className="ml-auto rounded-full border border-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                                Following
                              </span>
                            ) : null}
                          </div>
                          <p className="line-clamp-2 break-words text-xs text-brand-soft">
                            {complaint.message || "No message provided."}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-brand-soft">
                            <span className="break-all">{complaint.email}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles}`}
                              >
                                {statusLabel}
                              </span>
                              <span className="whitespace-nowrap">{readableDate}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <div className="flex flex-1 flex-col">
                {selectedComplaint ? (
                  <article className="flex h-full flex-col bg-white">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand px-6 py-5">
                      <div>
                        <h3 className="text-base font-semibold text-brand-strong">
                          {selectedComplaint.fullName}
                        </h3>
                        <p className="break-all text-xs text-brand-soft">
                          {selectedComplaint.email}
                          {selectedComplaint.phone ? (
                            <>
                              {" "}
                              • {selectedComplaint.phone}
                            </>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
                        <span>Status:</span>
                        <span className="rounded-full border border-brand bg-brand-soft px-3 py-1 text-brand-muted">
                          {selectedStatusLabel}
                        </span>
                      </div>
                    </header>

                    <div className="flex flex-col gap-6 px-6 py-6">
                      <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateComplaintState(selectedComplaint.id, { isRead: false })
                            }
                            disabled={isSelectedComplaintUnread}
                            title="Reset the read indicator so teammates know this complaint still needs attention."
                            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                              isSelectedComplaintUnread
                                ? "cursor-not-allowed border-brand/60 bg-brand-soft text-brand-soft"
                                : "border-brand bg-brand-soft text-brand-muted transition-transform hover:-translate-y-[1px] hover:border-brand-strong hover:bg-white active:translate-y-0"
                            }`}
                          >
                            Mark as Unread
                          </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateComplaintState(selectedComplaint.id, {
                              isFollowing: !isSelectedComplaintFollowing,
                            })
                          }
                          title={
                            isSelectedComplaintFollowing
                              ? "Stop following to remove yourself from updates."
                              : "Follow this complaint to signal that you are tracking its progress."
                          }
                          aria-pressed={isSelectedComplaintFollowing}
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                            isSelectedComplaintFollowing
                              ? "border-transparent btn-brand text-white transition-transform hover:-translate-y-[1px] hover:text-white active:translate-y-0"
                              : "border-brand bg-brand-soft text-brand-muted transition-transform hover:-translate-y-[1px] hover:border-brand-strong hover:bg-white active:translate-y-0"
                          }`}
                        >
                          Following
                        </button>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                          Update status
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {STATUS_OPTIONS.map((option) => {
                            const isSelected = selectedStatus === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  updateComplaintState(selectedComplaint.id, {
                                    status: option.value,
                                  })
                                }
                                aria-pressed={isSelected}
                                title={option.tooltip}
                                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                                  isSelected
                                    ? "border-transparent btn-brand text-white transition-transform hover:-translate-y-[1px] hover:text-white active:translate-y-0"
                                    : "border-brand bg-white text-brand-muted transition-transform hover:-translate-y-[1px] hover:border-brand-strong hover:bg-brand-soft active:translate-y-0"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <section className="rounded-xl border border-brand bg-brand-soft px-5 py-5 text-sm text-brand-muted shadow-sm">
                        <p className="whitespace-pre-wrap break-all">
                          {selectedComplaint.message || "No message provided."}
                        </p>
                      </section>
                    </div>

                    <footer className="mt-auto border-t border-brand bg-brand-soft/50 px-6 py-4 text-xs text-brand-soft">
                      Submitted on{" "}
                      {(() => {
                        const submittedDate = new Date(selectedComplaint.submittedAt);
                        return Number.isNaN(submittedDate.getTime())
                          ? selectedComplaint.submittedAt
                          : submittedDate.toLocaleString();
                      })()}
                    </footer>
                  </article>
                ) : (
                  <div className="flex h-full items-center justify-center bg-white text-sm text-brand-soft">
                    Select a complaint to preview the full details.
                  </div>
                )}
              </div>
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
