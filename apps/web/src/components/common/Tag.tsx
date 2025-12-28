import React from "react";

interface TagProps {
  label: string;
  color?: "primary" | "secondary" | "accent" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  onClick?: () => void;
}

/**
 * Tag — 카테고리/필터용 태그. 다크모드 톤 다운 컬러 지원
 */
const Tag: React.FC<TagProps> = ({ label, color = "ghost", size = "md", onClick }) => {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary",
    secondary:
      "bg-secondary/15 text-secondary dark:bg-secondary/20 dark:text-secondary",
    accent: "bg-surface text-text-main dark:bg-surface/60 dark:text-text-main",
    ghost:
      "bg-background-sub text-text-secondary dark:bg-surface/60 dark:text-text-secondary",
  };

  const sizeClasses: Record<string, string> = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full font-medium 
        ${colorClasses[color]} ${sizeClasses[size]} 
        ${onClick ? "cursor-pointer hover:opacity-90" : ""} transition-all`}
    >
      {label}
    </span>
  );
};

export default Tag;
