import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  /** 카드 내부 컨텐츠 */
  children: ReactNode;
  /** 그림자 강도 */
  elevation?: "none" | "sm" | "md" | "lg";
  /** 카드 배경색 유형 */
  variant?: "default" | "surface" | "transparent";
  /** 클릭 가능한 카드 여부 */
  hoverable?: boolean;
  className?: string;
}

/**
 * 공통 Card 컴포넌트
 * - radius, 그림자, hover 효과 일관화
 * - elevation / variant props 제공
 */
const Card = ({
  children,
  elevation = "md",
  variant = "surface",
  hoverable = false,
  className = "",
}: CardProps) => {
  const elevationClass =
    elevation === "none"
      ? ""
      : elevation === "sm"
      ? "shadow-sm"
      : elevation === "lg"
      ? "shadow-lg"
      : "shadow-md";

  const bgClass =
    variant === "surface"
      ? "bg-surface dark:bg-surface/90"
      : variant === "transparent"
      ? "bg-transparent"
      : "bg-background dark:bg-background-sub";

  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.02 } : {}}
      className={`rounded-2xl border border-border ${bgClass} ${elevationClass} transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
