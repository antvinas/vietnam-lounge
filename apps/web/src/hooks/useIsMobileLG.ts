import { useEffect, useState } from "react";

/**
 * <lg (1024px 미만) 뷰포트 여부를 반환한다.
 * - matchMedia('max-width:1023.98px') 사용
 * - SSR 안전 가드 포함
 */
export default function useIsMobileLG(): boolean {
  const query = "(max-width: 1023.98px)";
  const getMatches = () =>
    typeof window !== "undefined" && "matchMedia" in window
      ? window.matchMedia(query).matches
      : false;

  const [isMobile, setIsMobile] = useState<boolean>(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    // 표준: addEventListener('change'), 구형 브라우저 대비 removeListener fallback
    if ("addEventListener" in mql) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      // @ts-expect-error Fallback for older browsers
      mql.addListener(handler);
      // @ts-expect-error Fallback for older browsers
      return () => mql.removeListener(handler);
    }
  }, []);

  return isMobile;
}
