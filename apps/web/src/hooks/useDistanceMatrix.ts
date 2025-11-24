/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";

export type LatLng = { lat: number; lng: number };
export type Mode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

export type KmMin = { distanceKm: number; durationMin: number };

export type Params = {
  origins: Array<LatLng | string>;
  destinations: Array<LatLng | string>;
  mode: Mode;
  departureTime?: Date;
  trafficModel?: "best_guess" | "pessimistic" | "optimistic";
  unitSystem?: "METRIC" | "IMPERIAL";
};

type State = {
  loading: boolean;
  error?: Error;
  single?: KmMin | null;
  matrix?: (KmMin | null)[][];
};

const TTL_MS = 5 * 60 * 1000;
const MAX_RETRY = 3;
const cache = new Map<string, { ts: number; data: State }>();

const round = (n: number, p = 5) => Math.round(n * 10 ** p) / 10 ** p;
const keyLL = (v: LatLng | string) => (typeof v === "string" ? v : `${round(v.lat)},${round(v.lng)}`);
const makeKey = (p: Params) =>
  JSON.stringify({
    o: p.origins.map(keyLL),
    d: p.destinations.map(keyLL),
    m: p.mode,
    t: p.departureTime ? Math.floor(p.departureTime.getTime() / 60000) : null,
    tm: p.trafficModel ?? "best_guess",
    u: p.unitSystem ?? "METRIC",
  });

async function ensureService(): Promise<any> {
  if (!(window as any).google?.maps?.importLibrary) {
    throw new Error("Google Maps JS not loaded");
  }
  const { DistanceMatrixService } = await (window as any).google.maps.importLibrary("routes");
  return new DistanceMatrixService();
}

function toKmMin(el: any): KmMin | null {
  if (!el || el.status !== "OK") return null;
  const dur = el.duration_in_traffic ?? el.duration;
  return {
    distanceKm: el.distance?.value ? Math.round((el.distance.value / 100) ) / 10 : 0, // 1 decimal km
    durationMin: dur?.value ? Math.round(dur.value / 60) : 0,
  };
}

async function requestMatrix(p: Params, attempt = 1): Promise<State> {
  const svc = await ensureService();

  const req: any = {
    origins: p.origins,
    destinations: p.destinations,
    travelMode: p.mode,
    unitSystem: p.unitSystem === "IMPERIAL" ? 1 : 0, // google.maps.UnitSystem
  };
  if (p.mode === "DRIVING" || p.mode === "TRANSIT") {
    if (p.departureTime) {
      req.drivingOptions = { departureTime: p.departureTime, trafficModel: p.trafficModel ?? "best_guess" };
      if (p.mode === "TRANSIT") req.transitOptions = { departureTime: p.departureTime };
    }
  }

  try {
    const data: any = await new Promise((resolve, reject) => {
      svc.getDistanceMatrix(req, (res: any, status: string) => {
        if (status !== "OK") reject(new Error(`DistanceMatrix ${status}`));
        else resolve(res);
      });
    });

    const rows = (data?.rows ?? []) as any[];
    const matrix: (KmMin | null)[][] = rows.map((r) => (r.elements ?? []).map(toKmMin));
    const single = matrix.length === 1 && matrix[0]?.length === 1 ? matrix[0][0] : null;
    return { loading: false, matrix, single };
  } catch (err) {
    if (attempt >= MAX_RETRY) {
      throw err instanceof Error ? err : new Error(String(err));
    }
    const backoff = 400 * 2 ** (attempt - 1);
    await new Promise((r) => setTimeout(r, backoff));
    return requestMatrix(p, attempt + 1);
  }
}

/** React 훅 */
export default function useDistanceMatrix(p: Params): State {
  const [state, setState] = useState<State>({ loading: true, single: null, matrix: undefined });
  const key = makeKey(p);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const hit = cache.get(key);
    const now = Date.now();
    if (hit && now - hit.ts < TTL_MS) {
      setState(hit.data);
      return () => {
        alive.current = false;
      };
    }

    setState((s) => ({ ...s, loading: true, error: undefined }));
    requestMatrix(p)
      .then((data) => {
        if (!alive.current) return;
        const next = { ...data, loading: false } as State;
        cache.set(key, { ts: Date.now(), data: next });
        setState(next);
      })
      .catch((err: any) => {
        if (!alive.current) return;
        setState({ loading: false, error: err, single: null, matrix: undefined });
      });

    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

/** ========== 인접쌍 헬퍼 ========== */
/** 일정 아이템 배열 -> origins, destinations 자동 매핑
 *  items[i] -> items[i+1]을 하나의 세그먼트로 본다.
 *  origins = [i0, i1, i2], destinations = [i1, i2, i3]
 *  결과 matrix[i][i] 가 바로 i->i+1 세그먼트다.
 */
export function buildAdjacencyArgs(
  items: Array<{ lat?: number; lng?: number }>,
  mode: Mode,
  opts?: { departureTime?: Date; trafficModel?: "best_guess" | "pessimistic" | "optimistic"; unitSystem?: "METRIC" | "IMPERIAL" }
): Params | null {
  const pts = items.filter((p) => typeof p.lat === "number" && typeof p.lng === "number") as LatLng[];
  if (pts.length < 2) return null;
  const origins: LatLng[] = [];
  const destinations: LatLng[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    origins.push({ lat: pts[i].lat, lng: pts[i].lng });
    destinations.push({ lat: pts[i + 1].lat, lng: pts[i + 1].lng });
  }
  return {
    origins,
    destinations,
    mode,
    departureTime: opts?.departureTime,
    trafficModel: opts?.trafficModel ?? "best_guess",
    unitSystem: opts?.unitSystem ?? "METRIC",
  };
}

/** 대각선(인접 세그먼트)의 KmMin 배열을 추출 */
export function diagonalSegments(matrix?: (KmMin | null)[][]): (KmMin | null)[] {
  if (!matrix || matrix.length === 0) return [];
  const len = Math.min(matrix.length, matrix[0]?.length ?? 0);
  const out: (KmMin | null)[] = [];
  for (let i = 0; i < len; i++) out.push(matrix[i]?.[i] ?? null);
  return out;
}
