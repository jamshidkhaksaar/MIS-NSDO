"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useDashboardData } from "@/context/DashboardDataContext";

export default function LoginPage() {
  const { branding } = useDashboardData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("This prototype does not support authentication.");
  };

  const brandName = branding.companyName?.trim() || "Brand";
  const brandLogo = branding.logoDataUrl;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-16 items-center">
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brandLogo}
                  alt="Organisation logo"
                  className="max-h-16 w-auto object-contain"
                />
              ) : (
                <div className="flex h-16 min-w-[72px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-5">
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Welcome back</p>
              <h1 className="text-2xl font-semibold text-slate-900">{brandName} Portal</h1>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-500">
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-12">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Log in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with your MIS credentials. Contact the administrator if you need access.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span className="text-xs uppercase tracking-wide text-slate-500">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.org"
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span className="text-xs uppercase tracking-wide text-slate-500">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400">
            This login screen is a placeholder. Integrate with your identity provider to enable access control.
          </p>
        </section>
      </main>
    </div>
  );
}
