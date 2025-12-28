import { ReactNode } from "react";

export default function CouponBadge({
  icon,
  label,
  tone = "explorer",
}: {
  icon?: ReactNode;
  label: string;
  tone?: "explorer" | "nightlife";
}) {
  const cls = tone === "explorer" ? "bg-[#2BB6C5]/15 text-[#2BB6C5]" : "bg-[#8B5CF6]/20 text-[#C4B5FD]";

  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium leading-none whitespace-nowrap ${cls}`}
      aria-label="쿠폰 배지"
    >
      {icon} {label}
    </span>
  );
}
