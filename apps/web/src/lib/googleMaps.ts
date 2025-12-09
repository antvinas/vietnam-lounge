// src/lib/googleMaps.ts
// - importLibrary() 기반 로더 싱글턴
// - Map ID(light/dark) 스위칭 유틸 + 150ms 스로틀 옵저버 제공
import { setOptions } from "@googlemaps/js-api-loader";

type LibName = "maps" | "marker" | "places";

let optsSet = false;
let mapsP: Promise<void> | null = null;
let markerP: Promise<void> | null = null;
let placesP: Promise<void> | null = null;

/** 구식/오타 스크립트 제거 (전역 오염 방지) */
function evictLegacyScript() {
  const els = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]')
  );
  for (const s of els) {
    const src = s.src || "";
    const hasKey = /[?&]key=/.test(src);
    const hasWrong = /[?&]api_key=/.test(src);
    if (!hasKey || hasWrong) {
      try {
        s.parentElement?.removeChild(s);
      } catch {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google = undefined;
    }
  }
}

function ensureOptions() {
  if (optsSet) return;
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) throw new Error("VITE_GOOGLE_MAPS_API_KEY is missing");
  evictLegacyScript();
  // js-api-loader v2 — 부트스트랩 옵션 (주간 채널 권장)
  setOptions({ key, version: "weekly" });
  optsSet = true;
}

async function importLib(name: LibName) {
  ensureOptions();
  // Dynamic Library Import (google.maps.importLibrary) 사용. :contentReference[oaicite:5]{index=5}
  await (google.maps as any).importLibrary(name);
}

export async function ready(opts?: { withPlaces?: boolean; withMarker?: boolean }) {
  if (!mapsP) mapsP = importLib("maps");
  if (opts?.withMarker !== false && !markerP) markerP = importLib("marker");
  if (opts?.withPlaces && !placesP) placesP = importLib("places");
  await mapsP;
  if (opts?.withMarker !== false) await markerP;
  if (opts?.withPlaces) await placesP;
  return (window as any).google;
}

export function getDefaultMapId(theme?: "light" | "dark") {
  // Map ID 기반 스타일 전환. :contentReference[oaicite:6]{index=6}
  const light = import.meta.env.VITE_GMAP_ID_LIGHT as string | undefined;
  const dark = import.meta.env.VITE_GMAP_ID_DARK as string | undefined;
  return theme === "dark"
    ? (dark || light || "DEMO_MAP_ID")
    : (light || dark || "DEMO_MAP_ID");
}

export async function createMap(
  el: HTMLElement,
  options: google.maps.MapOptions & { theme?: "light" | "dark" } = {} as any
) {
  const g = await ready();
  const mapId = options.mapId ?? getDefaultMapId(options.theme);
  const { theme, ...rest } = options as any;
  return new g.maps.Map(el, { ...rest, mapId });
}

/** AdvancedMarkerElement 우선, 불가 시 Marker 폴백. (Marker는 deprec 권고) :contentReference[oaicite:7]{index=7} */
export async function createAdvancedMarker(
  options: google.maps.marker.AdvancedMarkerElementOptions & { map?: google.maps.Map }
): Promise<google.maps.marker.AdvancedMarkerElement | google.maps.Marker> {
  const g = await ready({ withMarker: true });
  const Advanced = g.maps.marker?.AdvancedMarkerElement;
  if (Advanced) return new Advanced(options as any);
  // @ts-expect-error: 레거시 폴백
  return new g.maps.Marker(options);
}

/** 간단 스로틀 */
function throttle<T extends (...a: any[]) => void>(fn: T, wait = 150): T {
  let ticking = false;
  let lastArgs: any[] | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any, ...args: any[]) {
    if (ticking) {
      lastArgs = args;
      return;
    }
    fn.apply(this, args);
    ticking = true;
    setTimeout(() => {
      ticking = false;
      if (lastArgs) {
        const a = lastArgs;
        lastArgs = null;
        fn.apply(this, a);
      }
    }, wait);
  } as T;
}

/**
 * 다크/라이트 테마 전환 감지 후 mapId 스위칭.
 * - DOM의 <html class="dark"> 토글을 MutationObserver로 감시
 * - 150ms 스로틀로 과도한 setOptions 방지
 * 사용처: MapPanel에서 createMap 후 반환 함수를 호출해 정리.
 * MDN MutationObserver 참고. :contentReference[oaicite:8]{index=8}
 */
export function observeThemeAndSwitchMapId(
  map: google.maps.Map,
  throttleMs = 150
): () => void {
  const apply = throttle(() => {
    const dark = document.documentElement.classList.contains("dark");
    map.setOptions({
      mapId: getDefaultMapId(dark ? "dark" : "light"),
    } as google.maps.MapOptions);
  }, throttleMs);

  const obs = new MutationObserver(apply);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // 최초 1회 반영
  apply();

  // 정리 함수
  return () => obs.disconnect();
}

declare global {
  // eslint-disable-next-line no-var
  var google: any;
}
