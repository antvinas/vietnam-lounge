// apps/web/src/lib/googleDirections.ts

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type DayRouteLeg = {
  path: LatLngLiteral[];
  distanceMeters?: number;
  durationSec?: number;
};

export type DayRouteResult = {
  /** 경로 전체를 그리는 데 쓸 polyline 좌표들 (overview_path 기반) */
  path: LatLngLiteral[];
  /** legs 의 distance 합 */
  distanceMetersTotal?: number;
  /** legs 의 duration 합 (초 단위) */
  durationSecTotal?: number;
  /** 각 구간별(이전 장소 → 다음 장소) 정보 – 필요하면 확장해서 사용 */
  legs?: DayRouteLeg[];
};

export type DayRouteRequest = {
  origin: LatLngLiteral;
  destination: LatLngLiteral;
  waypoints?: LatLngLiteral[];
  /** "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING" */
  travelMode?: "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING";
};

/**
 * Google Maps DirectionsService 래퍼
 * - origin, destination, waypoints를 받아서
 * - overview_path + 총 거리/시간만 뽑아서 반환
 *
 * ⚠️ window.google.maps 가 로딩되어 있어야 동작한다.
 *    (없으면 null 반환)
 */
export async function getRoute(
  req: DayRouteRequest
): Promise<DayRouteResult | null> {
  if (typeof window === "undefined") return null;
  const g = (window as any).google;
  if (!g || !g.maps || !g.maps.DirectionsService) {
    console.warn("[googleDirections] google.maps.DirectionsService 없음");
    return null;
  }

  const service = new g.maps.DirectionsService();

  const travelModeKey = req.travelMode ?? "DRIVING";
  const travelMode =
    g.maps.TravelMode?.[travelModeKey] ?? g.maps.TravelMode.DRIVING;

  const request: any = {
    origin: req.origin,
    destination: req.destination,
    travelMode,
  };

  if (req.waypoints && req.waypoints.length > 0) {
    request.waypoints = req.waypoints.map((w) => ({
      location: w,
      stopover: true,
    }));
  }

  return new Promise<DayRouteResult | null>((resolve) => {
    service.route(request, (result: any, status: any) => {
      if (
        status !== g.maps.DirectionsStatus.OK ||
        !result ||
        !result.routes ||
        !result.routes.length
      ) {
        console.warn("[googleDirections] Directions 실패:", status);
        resolve(null);
        return;
      }

      const route = result.routes[0];

      // overview_path → LatLngLiteral[]
      const overviewPath: LatLngLiteral[] = (route.overview_path ?? []).map(
        (p: any) => {
          const lat =
            typeof p.lat === "function" ? p.lat() : p.lat ?? 0;
          const lng =
            typeof p.lng === "function" ? p.lng() : p.lng ?? 0;
          return { lat, lng };
        }
      );

      let totalDist = 0;
      let totalDur = 0;
      const legs: DayRouteLeg[] = [];

      for (const leg of route.legs ?? []) {
        const d = leg.distance?.value ?? 0; // meters
        const dur = leg.duration?.value ?? 0; // seconds
        totalDist += d;
        totalDur += dur;

        // leg별 상세 path는 필요 시 step.path들을 합쳐 쓸 수 있다.
        const legPath: LatLngLiteral[] = [];
        for (const step of leg.steps ?? []) {
          for (const p of step.path ?? []) {
            const lat =
              typeof p.lat === "function" ? p.lat() : p.lat ?? 0;
            const lng =
              typeof p.lng === "function" ? p.lng() : p.lng ?? 0;
            legPath.push({ lat, lng });
          }
        }

        legs.push({
          path: legPath.length ? legPath : overviewPath,
          distanceMeters: d,
          durationSec: dur,
        });
      }

      resolve({
        path: overviewPath,
        distanceMetersTotal: totalDist || undefined,
        durationSecTotal: totalDur || undefined,
        legs,
      });
    });
  });
}

/**
 * Day 전체를 Google Maps 외부 길찾기로 열 때 사용할 URL builder
 * - origin, destination, waypoints 를 넘기면 된다.
 */
export function buildGoogleDirectionsUrl(opts: {
  origin: LatLngLiteral;
  destination: LatLngLiteral;
  waypoints?: LatLngLiteral[];
  travelMode?: "driving" | "walking" | "transit" | "bicycling";
}) {
  const origin = `${opts.origin.lat},${opts.origin.lng}`;
  const destination = `${opts.destination.lat},${opts.destination.lng}`;
  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("origin", origin);
  params.set("destination", destination);
  if (opts.waypoints && opts.waypoints.length) {
    const wp = opts.waypoints
      .map((w) => `${w.lat},${w.lng}`)
      .join("|");
    params.set("waypoints", wp);
  }
  if (opts.travelMode) {
    params.set("travelmode", opts.travelMode);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
