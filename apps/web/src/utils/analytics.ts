type Params = Record<string, unknown> | undefined;

export function track(event: string, params?: Params) {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, params || {});
      return;
    }
    if (typeof window !== 'undefined' && (window as any).firebase?.analytics) {
      (window as any).firebase.analytics().logEvent(event, params || {});
      return;
    }
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, params || {});
  } catch {}
}

/** 기존 코드 호환용 래퍼 */
export const logEvent = track;

export function logSponsorViewEvent(params?: { id?: string; pos?: string; source?: string }) {
  track('sponsor_view', params);
}
export function logSponsorClickEvent(params?: { id?: string; pos?: string; source?: string }) {
  track('sponsor_click', params);
}
export function logAdImpressionEvent(params?: { slot?: string; id?: string }) {
  track('ad_impression', params);
}
export function logAdClickEvent(params?: { slot?: string; id?: string }) {
  track('ad_click', params);
}
export function logSpotViewEvent(params?: { id?: string; source?: string }) {
  track('spot_view', params);
}
export function logSpotClickEvent(params?: { id?: string; source?: string }) {
  track('spot_click', params);
}
