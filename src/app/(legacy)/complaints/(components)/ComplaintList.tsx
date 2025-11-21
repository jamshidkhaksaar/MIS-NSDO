"use client";

import { ComplaintRecord } from "@/lib/dashboard-data";

export function ComplaintList({ complaints, selectedComplaintId, onSelectComplaint }: {
  complaints: ComplaintRecord[];
  selectedComplaintId: string | null;
  onSelectComplaint: (id: string) => void;
}) {
  return (
    <aside className="flex w-full max-w-xs flex-1 flex-col border-r border-brand/70 bg-white/90">
      <div className="flex items-center justify-between border-b border-brand px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brand-soft">
        <span>Inbox</span>
        <span className="rounded-full border border-brand px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
          {complaints.length}
        </span>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {complaints.map((complaint) => {
          const submittedDate = new Date(complaint.submittedAt);
          const readableDate = Number.isNaN(submittedDate.getTime())
            ? complaint.submittedAt
            : submittedDate.toLocaleString();
          const isActive = selectedComplaintId === complaint.id;

          return (
            <li key={complaint.id} className="border-b border-brand/40 last:border-b-0">
              <button
                type="button"
                title={`Open complaint from ${complaint.fullName}`}
                onClick={() => onSelectComplaint(complaint.id)}
                className={`flex w-full flex-col gap-2 px-4 py-4 text-left transition ${
                  isActive ? "bg-brand-soft/80" : "hover:bg-brand-soft/60"
                }`}
                aria-current={isActive ? "true" : undefined}
              >
                <div className="flex items-center gap-2">
                  <p
                    className={`break-words text-sm font-semibold ${
                      isActive ? "text-brand-strong" : "text-brand-muted"
                    }`}
                  >
                    {complaint.fullName}
                  </p>
                </div>
                <p className="line-clamp-2 break-words text-xs text-brand-soft">
                  {complaint.message || "No message provided."}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-brand-soft">
                  <span className="break-all">{complaint.email}</span>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">{readableDate}</span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
