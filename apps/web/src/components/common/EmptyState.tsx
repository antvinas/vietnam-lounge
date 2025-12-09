interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, actionLabel, onAction, icon, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center shadow-card ${className}`}>
      {icon ? <div className="mb-3 text-3xl text-text-secondary">{icon}</div> : null}
      <h3 className="text-lg font-bold text-text-main">{title}</h3>
      {description ? <p className="mt-2 max-w-prose text-sm text-text-secondary">{description}</p> : null}
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
