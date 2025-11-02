"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/context/DashboardDataContext";
import Loading from "./loading";

function AuthActionLoader({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/80 backdrop-blur">
      <div className="flex h-12 w-12 items-center justify-center">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-l-transparent border-t-transparent"
          aria-hidden
        />
      </div>
      <p className="text-sm font-semibold text-brand-muted">{message}</p>
    </div>
  );
}

export default function LoginPage() {
  const { branding, isLoading } = useDashboardData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const router = useRouter();

  if (isLoading) {
    return <Loading />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setAuthMessage("Signing in...");

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      setAuthMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message ?? "Unable to sign in. Check your credentials.";
        setError(message);
        setAuthMessage(null);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error while signing in.");
      setAuthMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandName = branding.companyName?.trim() || "Brand";
  const brandLogo = branding.logoDataUrl;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#e6f6ea] to-[#f7fdf9]">
      <header className="border-b border-brand bg-white/95 backdrop-blur">
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
                <div className="flex h-16 min-w-[72px] items-center justify-center rounded-xl border border-brand bg-brand-soft px-5">
                  <span className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-brand-soft">Welcome back</p>
              <h1 className="text-2xl font-semibold text-brand-strong">{brandName} Portal</h1>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm text-brand-soft">
            <Link
              href="/"
              className="rounded-full px-4 py-2 font-medium chip-brand"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-12">
        <section className="relative w-full rounded-2xl border border-brand bg-white p-8 shadow-brand-soft">
          {authMessage ? <AuthActionLoader message={authMessage} /> : null}
          <h2 className="text-xl font-semibold text-brand-strong">Log in</h2>
          <p className="mt-1 text-sm text-brand-soft">
            Sign in with your MIS credentials. Contact the administrator if you need access.
          </p>

          <form
            className="mt-6 space-y-5"
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
          >
            <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
              <span className="text-xs uppercase tracking-wide text-brand-soft">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.org"
                className="rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                disabled={isSubmitting}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
              <span className="text-xs uppercase tracking-wide text-brand-soft">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                disabled={isSubmitting}
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white btn-brand"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Redirecting..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-xs text-brand-soft">
            Secure cookies maintain your MIS session. Contact the administrator if you encounter issues signing in.
          </p>
        </section>
      </main>
    </div>
  );
}