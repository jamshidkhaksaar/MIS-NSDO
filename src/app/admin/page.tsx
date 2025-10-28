"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  useDashboardData,
} from "@/context/DashboardDataContext";
import type { DashboardUserRole } from "@/lib/dashboard-data";

const ROLE_OPTIONS: DashboardUserRole[] = ["Administrator", "Editor", "Viewer"];

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

function createSecurePassword(length = 16): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const buffer = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(buffer);
  } else {
    for (let index = 0; index < length; index += 1) {
      buffer[index] = Math.floor(Math.random() * charset.length);
    }
  }
  return Array.from(buffer, (value) => charset[value % charset.length]).join("");
}

function meetsPasswordPolicy(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_POLICY_REGEX.test(password);
}

type UserFormState = {
  name: string;
  email: string;
  role: DashboardUserRole;
  organization: string;
  password: string;
};

const DEFAULT_FORM_STATE: UserFormState = {
  name: "",
  email: "",
  role: "Viewer",
  organization: "",
  password: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminDashboard() {
  const { users, addUser, removeUser, branding, updateBranding } = useDashboardData();
  const [formState, setFormState] = useState<UserFormState>(DEFAULT_FORM_STATE);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandNotice, setBrandNotice] = useState<string | null>(null);
  const [companyNameInput, setCompanyNameInput] = useState<string>(branding.companyName);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [lastIssuedPassword, setLastIssuedPassword] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCompanyNameInput(branding.companyName);
  }, [branding.companyName]);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  const MAX_ASSET_SIZE_BYTES = 1024 * 1024 * 2; // 2 MB

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Invalid file result"));
        }
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error("Unable to read the selected file."));
      };
      reader.readAsDataURL(file);
    });

  const handleAssetChange = (type: "logo" | "favicon") => async (event: ChangeEvent<HTMLInputElement>) => {
    setBrandError(null);
    setBrandNotice(null);
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setBrandError("Please choose an image file (PNG, JPG, SVG, or ICO).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_ASSET_SIZE_BYTES) {
      setBrandError("Please upload an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (type === "logo") {
        await updateBranding({ logoDataUrl: dataUrl });
        logoInputRef.current?.blur();
      } else {
        await updateBranding({ faviconDataUrl: dataUrl });
        faviconInputRef.current?.blur();
      }
      setBrandNotice(`${type === "logo" ? "Logo" : "Favicon"} updated successfully.`);
    } catch (uploadError) {
      setBrandError(
        uploadError instanceof Error ? uploadError.message : "Unable to process the selected file."
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleAssetReset = async (type: "logo" | "favicon") => {
    setBrandError(null);
    setBrandNotice(null);
    if (type === "logo") {
      await updateBranding({ logoDataUrl: null });
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    } else {
      await updateBranding({ faviconDataUrl: null });
      if (faviconInputRef.current) {
        faviconInputRef.current.value = "";
      }
    }
    setBrandNotice(`${type === "logo" ? "Logo" : "Favicon"} reset.`);
  };

  const handleGeneratePassword = () => {
    const password = createSecurePassword();
    setFormState((prev) => ({ ...prev, password }));
    setIsPasswordVisible(true);
    setPasswordCopied(false);
    setLastIssuedPassword(null);
    setNotice("Strong password generated. Share securely with the user once saved.");
    setError(null);
  };

  const copyPasswordToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setPasswordCopied(true);
      window.setTimeout(() => setPasswordCopied(false), 2000);
    } catch (clipboardError) {
      console.error("Failed to copy password", clipboardError);
      setPasswordCopied(false);
    }
  };

  const handleCopyCurrentPassword = () => {
    if (!formState.password) {
      return;
    }
    void copyPasswordToClipboard(formState.password);
  };

  const handleCopyIssuedPassword = () => {
    if (!lastIssuedPassword) {
      return;
    }
    void copyPasswordToClipboard(lastIssuedPassword);
  };

  const handleCompanyNameSave = async () => {
    const trimmed = companyNameInput.trim();
    if (!trimmed) {
      setBrandNotice(null);
      setBrandError("Please provide a company or brand name.");
      return;
    }

    await updateBranding({ companyName: trimmed });
    setBrandError(null);
    setBrandNotice("Company name updated.");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedName = formState.name.trim();
    const trimmedEmail = formState.email.trim().toLowerCase();
    const trimmedPassword = formState.password.trim();
    const existingUser = users.find(
      (user) => user.email.toLowerCase() === trimmedEmail
    );

    if (!trimmedName) {
      setError("Please provide the user's full name.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!existingUser && !trimmedPassword) {
      setError("Generate or enter a secure password for new users.");
      return;
    }

    if (trimmedPassword && !meetsPasswordPolicy(trimmedPassword)) {
      setError("Passwords must be at least 12 characters and include upper, lower, number, and symbol.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addUser({
        name: trimmedName,
        email: trimmedEmail,
        role: formState.role,
        organization: formState.organization.trim() || undefined,
        password: trimmedPassword || undefined,
      });

      setFormState({
        ...DEFAULT_FORM_STATE,
        role: formState.role,
      });
      setLastIssuedPassword(trimmedPassword || null);
      setIsPasswordVisible(false);
      setPasswordCopied(false);
      setNotice(existingUser ? "User updated successfully." : "User created successfully.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async (id: string) => {
    await removeUser(id);
    setNotice("User removed from the workspace.");
  };

  return (
    <div className="min-h-screen bg-brand-soft">
      <header className="border-b border-brand bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-strong">
              Admin Dashboard
            </h1>
            <p className="text-sm text-brand-soft">
              Manage user access and roles for the MIS dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm font-medium chip-brand"
            >
              Public Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-2xl border border-brand bg-white shadow-brand-soft">
            <div className="border-b border-brand px-6 py-4">
              <h2 className="text-lg font-semibold text-brand-strong">Active Users</h2>
              <p className="text-sm text-brand-soft">
                Review access levels and remove accounts that are no longer required.
              </p>
            </div>
            <div className="divide-y divide-emerald-50">
              {sortedUsers.length ? (
                sortedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-brand-strong">{user.name}</p>
                      <p className="text-sm text-brand-soft">{user.email}</p>
                      <p className="text-xs uppercase tracking-wide text-brand-soft mt-1">
                        {user.role}
                        {user.organization ? ` • ${user.organization}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-sm text-brand-soft">
                  No users found. Add a user using the form on the right.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-brand bg-white shadow-brand-soft">
            <div className="border-b border-brand px-6 py-4">
              <h2 className="text-lg font-semibold text-brand-strong">Add New User</h2>
              <p className="text-sm text-brand-soft">
                Provide user details and assign a role to grant access.
              </p>
            </div>
            <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Full Name</span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="e.g. Mariam Qasemi"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Email Address</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="name@example.org"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Role</span>
                <select
                  value={formState.role}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, role: event.target.value as DashboardUserRole }))
                  }
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                <span className="text-xs uppercase tracking-wide text-brand-soft">Organization (optional)</span>
                <input
                  type="text"
                  value={formState.organization}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, organization: event.target.value }))
                  }
                  placeholder="NSDO HQ"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                />
              </label>

              <div className="space-y-2 text-sm font-medium text-brand-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-brand-soft">
                    Temporary password
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="rounded-full border border-brand bg-white px-3 py-1 text-brand-muted transition hover:bg-brand-soft"
                    >
                      Generate strong password
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCurrentPassword}
                      disabled={!formState.password}
                      className="rounded-full border border-brand bg-brand-soft px-3 py-1 text-brand-muted transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {passwordCopied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((previous) => !previous)}
                      className="rounded-full border border-brand bg-white px-3 py-1 text-brand-muted transition hover:bg-brand-soft"
                    >
                      {isPasswordVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  value={formState.password}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, password: event.target.value }));
                    setPasswordCopied(false);
                  }}
                  placeholder="Auto-generate or enter a secure password"
                  className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                />
                <p className="text-xs font-normal text-brand-soft">
                  Passwords must be at least {PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, number, and symbol. Leave blank to keep the current password when editing.
                </p>
              </div>

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
                {lastIssuedPassword ? (
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-brand bg-white px-3 py-2 text-xs text-brand-muted">
                    <div>
                      <p className="font-semibold">Issued password</p>
                      <p className="mt-1 break-all font-mono text-sm">{lastIssuedPassword}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyIssuedPassword}
                      className="rounded-full border border-brand bg-brand-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted transition hover:bg-brand-tint"
                    >
                      {passwordCopied ? "Copied" : "Copy"}
                    </button>
              </div>
                ) : null}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg px-5 py-2 text-sm font-semibold text-white btn-brand disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 pb-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-2xl border border-brand bg-white shadow-brand-soft">
            <div className="border-b border-brand px-6 py-4">
              <h2 className="text-lg font-semibold text-brand-strong">Branding Assets</h2>
              <p className="text-sm text-brand-soft">
                Upload your organisation&rsquo;s favicon and logo to personalise the dashboard experience.
              </p>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="space-y-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-brand-muted">
                  <span className="text-xs uppercase tracking-wide text-brand-soft">Company / brand name</span>
                  <input
                    type="text"
                    value={companyNameInput}
                    onChange={(event) => setCompanyNameInput(event.target.value)}
                    placeholder="e.g. NSDO"
                    className="w-full rounded-lg input-brand px-4 py-2 text-sm text-brand-muted"
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCompanyNameSave}
                    className="rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide chip-brand"
                  >
                    Save Name
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Logo</span>
                    <button
                      type="button"
                      onClick={() => handleAssetReset("logo")}
                      className="text-xs font-semibold uppercase tracking-wide text-brand-soft transition hover:text-rose-500"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl border border-brand bg-brand-soft px-4 py-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-brand bg-white">
                      {branding.logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={branding.logoDataUrl}
                          alt="Company logo preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">
                          No logo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 text-xs text-brand-soft">
                      <span>Recommended: transparent PNG at least 128×128 px.</span>
                      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-semibold uppercase tracking-wide chip-brand">
                        Upload Logo
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={handleAssetChange("logo")}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-soft">Favicon</span>
                    <button
                      type="button"
                      onClick={() => handleAssetReset("favicon")}
                      className="text-xs font-semibold uppercase tracking-wide text-brand-soft transition hover:text-rose-500"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl border border-brand bg-brand-soft px-4 py-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-brand bg-white">
                      {branding.faviconDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={branding.faviconDataUrl}
                          alt="Favicon preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-soft">
                          No icon
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 text-xs text-brand-soft">
                      <span>Recommended square image (32×32 or 64×64).</span>
                      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-semibold uppercase tracking-wide chip-brand">
                        Upload Favicon
                        <input
                          ref={faviconInputRef}
                          type="file"
                          accept="image/png,image/x-icon,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={handleAssetChange("favicon")}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {brandError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                    {brandError}
                  </div>
                ) : null}
                {brandNotice ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
                    {brandNotice}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand bg-white shadow-brand-soft">
            <div className="border-b border-brand px-6 py-4">
              <h2 className="text-lg font-semibold text-brand-strong">Live Preview</h2>
              <p className="text-sm text-brand-soft">
                Changes are stored in your browser and applied instantly across the dashboard.
              </p>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="rounded-xl border border-brand bg-brand-soft p-4">
                <p className="text-xs uppercase tracking-wide text-brand-soft">Navigation preview</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 items-center">
                    {branding.logoDataUrl ? (
                      <div className="flex h-12 items-center rounded-md border border-brand bg-white px-3 py-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={branding.logoDataUrl}
                          alt="Navigation logo preview"
                          className="max-h-full w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 min-w-[56px] items-center justify-center rounded-md border border-brand bg-brand-tint px-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-soft">Logo</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold tracking-tight text-brand-muted">
                    {companyNameInput || "Brand Placeholder"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-brand bg-brand-soft p-4">
                <p className="text-xs uppercase tracking-wide text-brand-soft">Favicon preview</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-brand bg-white">
                    {branding.faviconDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={branding.faviconDataUrl} alt="Favicon preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-soft">Icon</span>
                    )}
                  </div>
                  <div className="text-xs text-brand-soft">
                    <p>Your favicon updates the browser tab icon after upload.</p>
                    <p>
                      For best results provide a square image. Transparent PNGs or ICO files work well across browsers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
