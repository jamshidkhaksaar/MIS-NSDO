"use client";

import { ComplaintRecord } from "@/lib/dashboard-data";
import { useState } from "react";

export function ComplaintDetails({ complaint, onUpdateComplaint }: {
  complaint: ComplaintRecord | null;
  onUpdateComplaint: (id: string, updates: Partial<ComplaintRecord>) => void;
}) {
  const [response, setResponse] = useState("");

  if (!complaint) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-brand-soft">
        Select a complaint to preview the full details.
      </div>
    );
  }

  const handleResponseSubmit = () => {
    if (response.trim()) {
      onUpdateComplaint(complaint.id, { responses: [...complaint.responses, { id: Date.now().toString(), complaintId: complaint.id, response, createdAt: new Date().toISOString() }] });
      setResponse("");
    }
  };

  return (
    <article className="flex h-full flex-1 flex-col bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand px-6 py-5">
        <div>
          <h3 className="text-base font-semibold text-brand-strong">
            {complaint.fullName}
          </h3>
          <p className="break-all text-xs text-brand-soft">
            {complaint.email}
            {complaint.phone ? (
              <>
                {" "}
                • {complaint.phone}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-soft">
          <span>Status:</span>
          <span className="rounded-full border border-brand bg-brand-soft px-3 py-1 text-brand-muted">
            {complaint.status}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-6 py-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
            <span className="text-xs uppercase tracking-wide text-brand-soft">Village</span>
            <p>{complaint.village ?? "N/A"}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
            <span className="text-xs uppercase tracking-wide text-brand-soft">Gender</span>
            <p>{complaint.gender ?? "N/A"}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
            <span className="text-xs uppercase tracking-wide text-brand-soft">Source of Complaint</span>
            <p>{complaint.source_of_complaint ?? "N/A"}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
            <span className="text-xs uppercase tracking-wide text-brand-soft">How it was Reported</span>
            <p>{complaint.how_reported ?? "N/A"}</p>
          </div>
        </div>

        <section className="rounded-xl border border-brand bg-brand-soft px-5 py-5 text-sm text-brand-muted shadow-sm">
          <p className="whitespace-pre-wrap break-all">
            {complaint.message || "No message provided."}
          </p>
        </section>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
            Internal Classification
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
              <span className="text-xs uppercase tracking-wide text-brand-soft">Category</span>
              <select
                value={complaint.category ?? ""}
                onChange={(e) => onUpdateComplaint(complaint.id, { category: e.target.value })}
                className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
              >
                <option value="">Select...</option>
                <option value="Valid">Valid</option>
                <option value="Invalid">Invalid</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
              <span className="text-xs uppercase tracking-wide text-brand-soft">Type of Complaint</span>
              <select
                value={complaint.complaint_type ?? ""}
                onChange={(e) => onUpdateComplaint(complaint.id, { complaint_type: e.target.value })}
                className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
              >
                <option value="">Select...</option>
                <option value="Sensitive">Sensitive</option>
                <option value="Non-sensitive">Non-sensitive</option>
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
            Response History
          </p>
          <div className="space-y-4">
            {complaint.responses.map((response) => (
              <div key={response.id} className="rounded-xl border border-brand bg-brand-soft px-5 py-5 text-sm text-brand-muted shadow-sm">
                <p className="whitespace-pre-wrap break-all">{response.response}</p>
                <p className="mt-2 text-xs text-brand-soft">- {response.responder ?? "N/A"} on {new Date(response.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
            Add Response
          </p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            placeholder="Type your response here..."
            className="w-full rounded-lg input-brand px-4 py-3 text-sm text-brand-muted"
          />
          <button
            type="button"
            onClick={handleResponseSubmit}
            className="inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-semibold text-white btn-brand"
          >
            Add Response
          </button>
        </div>
      </div>

      <footer className="mt-auto border-t border-brand bg-brand-soft/50 px-6 py-4 text-xs text-brand-soft">
        Submitted on{" "}
        {(() => {
          const submittedDate = new Date(complaint.submittedAt);
          return Number.isNaN(submittedDate.getTime())
            ? complaint.submittedAt
            : submittedDate.toLocaleString();
        })()}
      </footer>
    </article>
  );
}
