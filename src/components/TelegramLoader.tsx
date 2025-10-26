import React from "react";

interface TelegramLoaderProps {
  className?: string;
}

export function TelegramCardLoader({ className = "" }: TelegramLoaderProps) {
  return (
    <div className={`rounded-2xl border border-brand bg-white p-5 shadow-sm ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-1/3 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
        <div className="h-8 w-2/3 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-1/2 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
      </div>
    </div>
  );
}

export function TelegramTableRowLoader() {
  return (
    <tr className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function TelegramChartLoader({ className = "" }: TelegramLoaderProps) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-brand bg-white shadow-sm ${className}`}>
      <div className="border-b border-brand bg-gradient-to-r from-[#e6f6ea] to-[#f7fdf9] px-6 py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-1/3 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          <div className="h-3 w-1/2 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-64 rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TelegramSectionLoader({ cardCount = 5 }: { cardCount?: number }) {
  return (
    <div className="rounded-3xl border border-brand bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-8">
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-1/4 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          <div className="h-4 w-1/2 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[...Array(cardCount)].map((_, i) => (
            <TelegramCardLoader key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TelegramMapLoader() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-brand bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-brand bg-gradient-to-r from-[#e6f6ea] to-[#f7fdf9] px-6 py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-2/3 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          <div className="h-3 w-1/2 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 w-20 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
            <div className="h-6 w-24 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-brand-soft p-4">
        <div className="w-full max-w-3xl" style={{ aspectRatio: "4 / 3" }}>
          <div className="h-full w-full animate-pulse rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
