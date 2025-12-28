import React from "react";

type Props = {
  tags?: string[];
  region?: string;
  city?: string;
  onTagClick?: (value: string) => void;
  className?: string;
};

export default function SpotTags({
  tags = [],
  region,
  city,
  onTagClick,
  className = "",
}: Props) {
  const pills = [
    region ? `#${region}` : null,
    city ? `#${city}` : null,
    ...tags.map((t) => `#${t}`),
  ].filter(Boolean) as string[];

  if (!pills.length) return null;

  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`}>
      <h3 className="mb-2 text-base font-semibold text-slate-100">태그</h3>
      <div className="flex flex-wrap gap-2">
        {pills.map((p, i) => (
          <button
            key={`${p}-${i}`}
            type="button"
            onClick={() => onTagClick?.(p.replace(/^#/, ""))}
            className="rounded-full border border-emerald-700/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300 hover:bg-emerald-500/20 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
            aria-label={`태그 ${p}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
