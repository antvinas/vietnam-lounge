// apps/web/src/components/spots/detail/SpotEmptyState.tsx
type Props = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
};

export default function SpotEmptyState({
  title = "정보가 부족합니다",
  description = "필요한 정보를 제보해 주시면 더 나은 서비스를 제공할 수 있습니다.",
  ctaLabel = "정보 제보",
  onCta,
  className = "",
}: Props) {
  return (
    <div className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`}>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">{description}</p>
      {onCta && (
        <button
          onClick={onCta}
          className="mt-3 inline-flex rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700/40"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
