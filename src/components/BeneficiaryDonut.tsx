"use client";

type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type BeneficiaryDonutProps = {
  data: DonutSlice[];
  className?: string;
  title?: string;
  subtitle?: string;
};

const RADIUS = 80;
const STROKE_WIDTH = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BeneficiaryDonut({
  data,
  className,
  title = "Beneficiaries",
  subtitle = "Distribution snapshot across primary cohorts.",
}: BeneficiaryDonutProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const safeTotal = total === 0 ? 1 : total;

  let cumulative = 0;
  const arcs = data.map((slice) => {
    const start = cumulative;
    const ratio = slice.value / safeTotal;
    const dashArray = `${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    const dashOffset = CIRCUMFERENCE - (start / safeTotal) * CIRCUMFERENCE;
    cumulative += slice.value;

    return {
      slice,
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className={`${className ?? ""} flex h-full flex-col justify-between`}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <svg
          width={200}
          height={200}
          viewBox="0 0 200 200"
          role="img"
          aria-label="Beneficiary distribution donut chart"
          className="max-w-full"
        >
          <g transform="rotate(-90 100 100)">
            {arcs.map(({ slice, dashArray, dashOffset }) => (
              <circle
                key={slice.label}
                cx={100}
                cy={100}
                r={RADIUS}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-opacity duration-300 hover:opacity-90"
              />
            ))}
          </g>

          <circle
            cx={100}
            cy={100}
            r={RADIUS - STROKE_WIDTH / 2}
            fill="white"
          />

          <text
            x={100}
            y={92}
            textAnchor="middle"
            className="fill-slate-900 text-xl font-semibold"
          >
            {total}
          </text>
          <text
            x={100}
            y={116}
            textAnchor="middle"
            className="fill-slate-500 text-xs uppercase tracking-wide"
          >
            Total
          </text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {data.map((slice) => (
          <div key={slice.label} className="flex items-center gap-2">
            <span
              className="inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">{slice.label}</span>
              <span className="text-xs text-slate-500">
                {((slice.value / safeTotal) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BeneficiaryDonut;
