"use client";

import { BENEFICIARY_TYPE_META } from "@/lib/dashboard-data";

export default function BeneficiaryBarChart({ data }: { data: Array<{ key: string; value: number }> }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full space-y-4">
      {data.map((item) => {
        const meta = BENEFICIARY_TYPE_META[item.key as keyof typeof BENEFICIARY_TYPE_META];
        const percentage = (item.value / maxValue) * 100;
        return (
          <div key={item.key} className="flex items-center gap-4">
            <div className="w-24 text-sm font-medium text-brand-muted">{meta.label}</div>
            <div className="flex-1 bg-brand-soft rounded-full h-6">
              <div
                className="h-6 rounded-full text-white text-xs flex items-center justify-end pr-2"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: meta.color,
                }}
              >
                {item.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
