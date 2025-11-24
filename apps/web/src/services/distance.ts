export type LatLng = { lat: number; lng: number };
export type Pair = { origin: LatLng; destination: LatLng };
export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";

export type MatrixOptions = {
  mode?: TravelMode;
  units?: "metric" | "imperial";
  provider?: "google" | "fallback"; // 기본 google → 실패 시 폴백
  departureTime?: Date; // DRIVING 시 교통량 반영
  concurrency?: number; // 동시 요청 제한
  ttlMs?: number; // TTL 캐시(기본 10분)
};

export type MatrixResult = {
  distanceMeters: number;
  durationSec: number;
  status: "OK" | "ZERO_RESULTS" | "ERROR";
  providerUsed: "google" | "fallback";
};

declare global {
  interface Window {
    google?: any;
  }
}

const DEFAULT_TTL = 10 * 60 * 1000; // 10분

// 단순 평균 속도(미터/초)
const MPS = {
  DRIVING: 13.9, // ~50km/h
  WALKING: 1.4, // ~5km/h
  BICYCLING: 4.5, // ~16km/h
  TRANSIT: 8.3, // ~30km/h
} as const;
const toMps = (mode: TravelMode) => MPS[mode] ?? MPS.DRIVING;

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(s));
  return R * c;
}

async function measureWithGoogle(
  pair: Pair,
  opts: Required<Pick<MatrixOptions, "mode" | "units">> & { departureTime?: Date }
): Promise<MatrixResult> {
  const gmaps = window.google?.maps;
  if (!gmaps?.DistanceMatrixService) throw new Error("DistanceMatrixService not available");
  const service = new gmaps.DistanceMatrixService();
  const travelMode = gmaps.TravelMode[opts.mode] || gmaps.TravelMode.DRIVING;
  const unitSystem =
    opts.units === "imperial" ? gmaps.UnitSystem.IMPERIAL : gmaps.UnitSystem.METRIC;
  const request: any = {
    origins: [pair.origin],
    destinations: [pair.destination],
    travelMode,
    unitSystem,
  };
  if (opts.mode === "DRIVING" && opts.departureTime) {
    request.drivingOptions = { departureTime: opts.departureTime };
  }

  const response = await new Promise<any>((resolve, reject) => {
    service.getDistanceMatrix(request, (res: any, status: string) => {
      if (status !== "OK") return reject(new Error(status));
      resolve(res);
    });
  });

  const element = response?.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    return {
      distanceMeters: 0,
      durationSec: 0,
      status: "ZERO_RESULTS",
      providerUsed: "google",
    };
  }
  const durationSec = element.duration_in_traffic?.value ?? element.duration?.value ?? 0;
  const distanceMeters = element.distance?.value ?? 0;
  return { distanceMeters, durationSec, status: "OK", providerUsed: "google" };
}

async function measureWithFallback(pair: Pair, mode: TravelMode): Promise<MatrixResult> {
  const meters = haversineMeters(pair.origin, pair.destination);
  const sec = meters / toMps(mode);
  return {
    distanceMeters: Math.round(meters),
    durationSec: Math.max(1, Math.round(sec)),
    status: "OK",
    providerUsed: "fallback",
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (t: T, i: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

// ── TTL 캐시 + 프라미스 디듀핑
const inflight = new Map<string, Promise<MatrixResult>>();
const cache = new Map<string, { at: number; value: MatrixResult }>();

function keyOf(pair: Pair, mode: TravelMode, units: Required<MatrixOptions>["units"]) {
  const o = `${pair.origin.lat.toFixed(5)},${pair.origin.lng.toFixed(5)}`;
  const d = `${pair.destination.lat.toFixed(5)},${pair.destination.lng.toFixed(5)}`;
  return `${o}|${d}|${mode}|${units}`;
}

export async function getMatrix(pairs: Pair[], options: MatrixOptions = {}) {
  const mode = options.mode ?? "DRIVING";
  const units = options.units ?? "metric";
  const provider = options.provider ?? "google";
  const concurrency = options.concurrency ?? 5;
  const ttl = options.ttlMs ?? DEFAULT_TTL;
  const canUseGoogle = !!window.google?.maps?.DistanceMatrixService;
  const preferGoogle = provider === "google";

  const worker = async (pair: Pair) => {
    const k = keyOf(pair, mode, units);
    const now = Date.now();
    const cached = cache.get(k);
    if (cached && now - cached.at < ttl) return cached.value;

    const inP = inflight.get(k);
    if (inP) return inP;

    const p = (async () => {
      try {
        if (preferGoogle && canUseGoogle) {
          const r = await measureWithGoogle(pair, { mode, units, departureTime: options.departureTime });
          cache.set(k, { at: Date.now(), value: r });
          return r;
        }
      } catch {
        // fall through
      }
      const r = await measureWithFallback(pair, mode);
      cache.set(k, { at: Date.now(), value: r });
      return r;
    })();

    inflight.set(k, p);
    try {
      return await p;
    } finally {
      inflight.delete(k);
    }
  };

  return mapWithConcurrency(pairs, concurrency, worker);
}
