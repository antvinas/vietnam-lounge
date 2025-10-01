import React from 'react';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const WidgetCard = ({ title, children, className = '' }: WidgetCardProps) => {
  return (
    <div className={`rounded-xl border border-border bg-surface p-5 shadow-explorer dark:shadow-nightlife ${className}`}>
      {/* Widget titles use the 'caption' style for a distinct, clean look */}
      <h3 className="text-caption font-medium uppercase tracking-wider text-text-secondary">{title}</h3>
      <div className="mt-4 space-y-3 text-body text-text-secondary">
        {children}
      </div>
    </div>
  );
};

export default WidgetCard;
