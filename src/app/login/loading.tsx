export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f0f8f2] via-white to-[#dfeee2] px-6 py-12 text-brand-strong">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl border border-brand bg-white/85 px-8 py-10 text-center shadow-xl backdrop-blur">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-brand opacity-40" aria-hidden />
          <div
            className="h-16 w-16 animate-spin rounded-full border-4 border-brand border-l-transparent border-t-transparent"
            aria-hidden
          />
        </div>
        <div className="space-y-3 text-brand-muted">
          <p className="text-lg font-semibold text-brand-strong">
            Verifying credentials
          </p>
          <p className="text-sm">
            We are activating secure access to the MIS dashboard. This should only take a moment.
          </p>
        </div>
        <div className="flex w-full items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-soft">
          <span className="h-1 w-1 rounded-full bg-brand-soft" aria-hidden />
          <span>Signing you in...</span>
          <span className="h-1 w-1 rounded-full bg-brand-soft" aria-hidden />
        </div>
      </div>
    </div>
  );
}
