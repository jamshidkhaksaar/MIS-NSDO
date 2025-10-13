"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useDashboardData } from "@/context/DashboardDataContext";

export default function ComplaintFormPage() {
  const { addComplaint } = useDashboardData();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address so our MEAL team can follow up.");
      return;
    }

    if (!message.trim()) {
      setError("Describe your complaint before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addComplaint({
        fullName,
        email,
        phone,
        message,
      });

      setNotice("Your complaint has been logged. Thank you for sharing your feedback.");
      setFullName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="border-b border-brand bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-strong">Submit a Complaint</h1>
            <p className="text-sm text-brand-soft">
              Share concerns or issues confidentially with the MEAL team. We review every submission.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold chip-brand"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-4xl px-6 pb-16">
        <section className="rounded-2xl border border-brand bg-white shadow-brand-soft">
          <form className="space-y-6 px-6 py-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Full Name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Amina Rahimi"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.org"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Phone (optional)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="e.g. +93 70 000 0000"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
              <span className="text-xs uppercase tracking-wide text-brand-soft">Complaint details</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                placeholder="Explain what happened, where, and any people involved."
                className="w-full rounded-lg input-brand px-4 py-3 text-sm text-brand-muted"
              />
            </label>

            <div className="space-y-3 text-sm">
              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                  {error}
                </div>
              ) : null}
              {notice ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white btn-brand disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
