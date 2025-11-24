/**
 * 📊 Google Analytics 4 기본 유틸
 * - 환경변수 VITE_GA_ID 사용 (예: G-XXXXXXX)
 * - gtag 초기화 및 이벤트 추적 함수
 */

const GA_ID = import.meta.env.VITE_GA_ID;

/**
 * GA4 초기화 — index.html에 스크립트 삽입
 */
export function initGA4(): void {
  if (!GA_ID) {
    console.warn("[GA4] Missing VITE_GA_ID in environment variables");
    return;
  }

  // 이미 로드된 경우 중복 방지
  if (window.dataLayer) return;

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  // 스크립트 삽입
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: true });
  console.log(`[GA4] Initialized with ID: ${GA_ID}`);
}

/**
 * 페이지뷰 수동 전송 (SPA 라우팅 시)
 */
export function trackPageView(path?: string): void {
  if (!GA_ID || !(window as any).gtag) return;
  (window as any).gtag("event", "page_view", {
    page_path: path || window.location.pathname,
    page_title: document.title,
  });
}

/**
 * 커스텀 이벤트 전송
 * @param eventName GA4 이벤트 이름
 * @param params 추가 파라미터
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  if (!GA_ID || !(window as any).gtag) return;
  (window as any).gtag("event", eventName, params || {});
}

/**
 * 광고/스폰서 관련 전용 이벤트
 * @param action 'view' | 'click'
 * @param spotId 스팟 ID
 * @param level banner | slider | infeed
 */
export function trackSponsorEvent(
  action: "view" | "click",
  spotId: string,
  level?: string
): void {
  trackEvent(`sponsor_${action}`, {
    spot_id: spotId,
    sponsor_level: level || "unknown",
    timestamp: Date.now(),
  });
}
