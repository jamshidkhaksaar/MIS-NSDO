export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#e6f6ea] via-white to-[#cfe8d8] px-6 py-12 text-brand-strong">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-3xl border border-brand bg-white/80 px-10 py-12 text-center shadow-2xl backdrop-blur">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-brand opacity-40" aria-hidden />
          <div
            className="h-20 w-20 animate-spin rounded-full border-4 border-brand border-l-transparent border-t-transparent"
            aria-hidden
          />
        </div>
        <div className="space-y-3">
          <p className="text-lg font-semibold tracking-tight">
            Preparing your humanitarian impact overview
          </p>
          <p className="text-sm text-brand-muted">
            Aggregating sector snapshots, provincial reach, and beneficiary insights. Sit tight—your
            dashboard will appear in a moment.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 text-brand-muted">
          <div className="overflow-hidden rounded-full border border-brand">
            <div
              className="h-2 w-full animate-pulse"
              style={{
                background: "linear-gradient(90deg, rgba(99,194,75,0.75), rgba(62,169,61,0.9))",
              }}
            />
          </div>
          <span className="text-xs uppercase tracking-wide text-brand-soft">
            Loading dashboard data...
          </span>
        </div>
      </div>
    </div>
  );
}
