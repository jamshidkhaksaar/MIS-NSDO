"use client";

export default function LegacyLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12 text-gray-800">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-l-transparent border-t-transparent" />
        <p className="text-sm font-semibold tracking-tight text-gray-600">Loading workspace...</p>
      </div>
    </div>
  );
}
