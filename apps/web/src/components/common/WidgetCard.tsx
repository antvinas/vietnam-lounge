import React from "react";

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * WidgetCard — 라이트/다크 모드 대응 카드 컴포넌트
 */
const WidgetCard = ({ title, children, className = "" }: WidgetCardProps) => {
  return (
    <div
      className={`rounded-xl border border-border bg-surface dark:bg-surface/80 
        p-5 shadow-card dark:shadow-depth transition-colors duration-200 ${className}`}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary dark:text-text-secondary">
        {title}
      </h3>
      <div className="mt-4 space-y-3 text-text-secondary dark:text-text-secondary/90">
        {children}
      </div>
    </div>
  );
};

export default WidgetCard;
