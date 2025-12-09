import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

/** 공통 Button */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) => {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 select-none";

  const sizeClass =
    size === "sm"
      ? "px-3 py-1.5 text-sm"
      : size === "lg"
      ? "px-6 py-3 text-base"
      : "px-4 py-2.5 text-sm";

  const variantClass =
    variant === "primary"
      ? "bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:shadow-lg focus-visible:outline-amber-500"
      : variant === "secondary"
      ? "bg-background-sub text-text-main hover:bg-background hover:scale-[1.02] dark:bg-zinc-800 dark:text-white"
      : variant === "outline"
      ? "border border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-zinc-800"
      : variant === "accent"
      ? "bg-gradient-to-r from-amber-400 to-pink-400 text-black hover:opacity-90 dark:from-purple-500 dark:to-pink-500 dark:text-white"
      : "text-text-secondary hover:text-text-main hover:bg-background-sub";

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`${base} ${sizeClass} ${variantClass} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
