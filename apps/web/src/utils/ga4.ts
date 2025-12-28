// apps/web/src/utils/ga4.ts

// 🟢 Window 인터페이스 확장
declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID;

export const pageview = (url: string) => {
  if (!window.dataLayer) return;
  window.dataLayer.push({
    event: "page_view",
    page_location: url,
  });
};

export const event = (name: string, params: Record<string, any>) => {
  if (!window.dataLayer) return;
  window.dataLayer.push({
    event: name,
    ...params,
  });
};

// 초기화 (필요시 호출)
export const initGA = () => {
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_TRACKING_ID);
};