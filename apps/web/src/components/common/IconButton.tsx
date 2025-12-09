import React, { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 스크린리더용. 아이콘만 있을 때 필수 */
  "aria-label": string;
  rounded?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-8 text-[14px]",
  md: "h-10 w-10 text-[16px]",
  lg: "h-12 w-12 text-[18px]",
};

export default function IconButton({
  children,
  className = "",
  rounded = true,
  size = "md",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[
        "inline-grid place-items-center",
        sizeClass[size],
        rounded ? "rounded-full" : "rounded-xl",
        "border border-slate-700/60 bg-slate-800/40 text-slate-200",
        "hover:bg-slate-800/60 hover:text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
