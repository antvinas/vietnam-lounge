/* @file apps/web/src/utils/fx.ts */

/** Simple debounce. Returns a function that returns the same Promise across calls until executed. */
export function debounce<F extends (...args: any[]) => any>(
  fn: F,
  wait = 200
): (...args: Parameters<F>) => Promise<ReturnType<F>> {
  let t: number | undefined;
  let lastArgs: any[] | null = null;
  let pending: Promise<any> | null = null;

  const runner = () =>
    new Promise<ReturnType<F>>((resolve) => {
      const res = fn(...(lastArgs as any[]));
      resolve(res as any);
      pending = null;
    });

  return (...args: any[]) => {
    lastArgs = args;
    if (t) window.clearTimeout(t);
    if (!pending) pending = new Promise((r) => (t = window.setTimeout(() => r(runner()), wait)));
    else t = window.setTimeout(() => runner(), wait);
    return pending as Promise<ReturnType<F>>;
  };
}

export const sleep = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms));

export function throttle<F extends (...args: any[]) => void>(
  fn: F,
  wait = 200
): F {
  let last = 0;
  let timer: number | null = null;
  // @ts-ignore
  return function throttled(this: any, ...args: any[]) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = window.setTimeout(() => {
        timer = null;
        last = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  } as F;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function tryJsonParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
