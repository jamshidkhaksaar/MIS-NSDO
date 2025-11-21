"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useDashboardData } from "@/context/DashboardDataContext";

export default function ComplaintFormPage() {
  const { addComplaint } = useDashboardData();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [gender, setGender] = useState("");
  const [sourceOfComplaint, setSourceOfComplaint] = useState("");
  const [howReported, setHowReported] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    if (isAnonymous) {
      setFullName("");
      setEmail("");
      setPhone("");
      setVillage("");
      setGender("");
      setSourceOfComplaint("");
      setHowReported("");
    }
  }, [isAnonymous]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!isAnonymous && !fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!isAnonymous && (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))) {
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
        fullName: isAnonymous ? "Anonymous" : fullName,
        email: isAnonymous ? "" : email,
        phone: isAnonymous ? "" : phone,
        village: isAnonymous ? "" : village,
        gender: isAnonymous ? "" : gender,
        source_of_complaint: isAnonymous ? "" : sourceOfComplaint,
        how_reported: isAnonymous ? "" : howReported,
        message,
        isAnonymous,
      });

      setNotice("Your complaint has been logged. Thank you for sharing your feedback.");
      setFullName("");
      setEmail("");
      setPhone("");
      setVillage("");
      setGender("");
      setSourceOfComplaint("");
      setHowReported("");
      setMessage("");
      setIsAnonymous(false);
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
            <div className="flex items-center gap-3">
              <input
                id="anonymous-checkbox"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <label htmlFor="anonymous-checkbox" className="text-sm font-medium text-brand-muted">
                Report Anonymously
              </label>
            </div>

            {isAnonymous && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold">You are reporting anonymously.</p>
                <p className="mt-1">
                  When you submit a complaint anonymously, we cannot follow up with you directly. If you
                  are comfortable, please provide contact details so our team can ask for more
                  information if needed.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Full Name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Amina Rahimi"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  disabled={isAnonymous}
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
                  disabled={isAnonymous}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Phone (optional)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="e.g. +93 70 000 0000"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  disabled={isAnonymous}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Village</span>
                <input
                  type="text"
                  value={village}
                  onChange={(event) => setVillage(event.target.value)}
                  placeholder="e.g. Kanam"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  disabled={isAnonymous}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Gender</span>
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  disabled={isAnonymous}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Source of Complaint</span>
                <select
                  value={sourceOfComplaint}
                  onChange={(event) => setSourceOfComplaint(event.target.value)}
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  disabled={isAnonymous}
                >
                  <option value="">Select...</option>
                  <option value="Project beneficiary">Project beneficiary</option>
                  <option value="Community member">Community member</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">How it was Reported</span>
                <select
                  value={howReported}
                  onChange={(event) => setHowReported(event.target.value)}
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  disabled={isAnonymous}
                >
                  <option value="">Select...</option>
                  <option value="In person (face to face)">In person (face to face)</option>
                  <option value="By phone">By phone</option>
                  <option value="Complaint box">Complaint box</option>
                  <option value="Community meeting">Community meeting</option>
                  <option value="Email">Email</option>
                  <option value="AWAAZ Afghanistan">AWAAZ Afghanistan</option>
                </select>
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
