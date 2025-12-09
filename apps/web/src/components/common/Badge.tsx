interface Props {
  text: string;
  color?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

/**
 * Badge — AI추천 / 에디터픽 공용 뱃지 (다크모드 색상 토큰 기반)
 */
const Badge = ({ text, color = "primary", className = "" }: Props) => {
  const colorMap: Record<string, string> = {
    primary:
      "bg-primary/90 text-white dark:bg-primary/80 dark:text-white",
    secondary:
      "bg-secondary/90 text-white dark:bg-secondary/80 dark:text-white",
    success:
      "bg-success/90 text-white dark:bg-success/80 dark:text-white",
    warning:
      "bg-warning/90 text-white dark:bg-warning/80 dark:text-white",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 
        text-xs font-semibold shadow-sm transition-colors ${colorMap[color]} ${className}`}
    >
      {text}
    </span>
  );
};

export default Badge;
