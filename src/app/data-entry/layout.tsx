import type { ReactNode } from "react";

interface DataEntryLayoutProps {
  children: ReactNode;
}

export default function DataEntryLayout({ children }: DataEntryLayoutProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12 text-brand-strong">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-strong">Data Entry</h1>
        <p className="text-sm text-brand-muted">
          Choose one of the modules below to manage and update programme records.
        </p>
      </header>
      <section className="flex-1 rounded-3xl border border-brand bg-white p-6 shadow-brand-soft">
        {children}
      </section>
    </div>
  );
}

