/* @file apps/web/src/utils/tsp.ts
   이동수단 가중치 반영 + 동률 시 거리→평점 순 타이브레이크.
*/
export type Coord = { lat: number; lng: number; rating?: number };
export type Mode =
  | "DRIVING"
  | "WALKING"
  | "TRANSIT"
  | "BICYCLING"
  // 내부 호환(플랜 블록의 mode와 동일 키)
  | "car"
  | "walk"
  | "transit"
  | "bike"
  | "grab";

const R = 6371;
const toRad = (x: number) => (x * Math.PI) / 180;
function haversine(a: Coord, b: Coord) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s)); // km
}

const DEFAULT_WEIGHTS: Record<Mode, number> = {
  DRIVING: 1.0,
  car: 1.0,
  grab: 1.0,
  BICYCLING: 1.35,
  bike: 1.35,
  TRANSIT: 1.2,
  transit: 1.2,
  WALKING: 1.8,
  walk: 1.8,
};

/** 비용 = 거리(km) × 이동수단 가중치 */
function costDistance(a: Coord, b: Coord, mode: Mode, weightMap?: Partial<Record<Mode, number>>) {
  const d = haversine(a, b);
  const w = weightMap?.[mode] ?? DEFAULT_WEIGHTS[mode] ?? 1.0;
  return { d, c: d * w };
}

function tourLen(coords: Coord[], ord: number[], mode: Mode, weightMap?: Partial<Record<Mode, number>>) {
  let s = 0;
  for (let i = 1; i < ord.length; i++) {
    const { c } = costDistance(coords[ord[i - 1]], coords[ord[i]], mode, weightMap);
    s += c;
  }
  return s;
}

export function nearestNeighborOrder(
  coords: Coord[],
  opts?: { startIndex?: number; mode?: Mode; weightMap?: Partial<Record<Mode, number>> }
): number[] {
  const n = coords.length;
  if (n <= 1) return [0];
  const start = Math.min(Math.max(opts?.startIndex ?? 0, 0), n - 1);
  const mode = opts?.mode ?? "DRIVING";

  const used = new Array(n).fill(false);
  const order = [start];
  used[start] = true;

  for (let i = 1; i < n; i++) {
    const last = coords[order[order.length - 1]];
    let best = -1;
    let bestCost = Infinity;
    let bestDist = Infinity;
    let bestRating = -Infinity;

    for (let j = 0; j < n; j++) {
      if (used[j]) continue;
      const { d, c } = costDistance(last, coords[j], mode, opts?.weightMap);
      const rating = coords[j].rating ?? 0;

      // 1) 비용 우선  2) 동률 시 실제거리 짧은 것  3) 다시 동률이면 평점 높은 것
      const eps = 1e-9;
      const betterCost = c + eps < bestCost;
      const tieCost = Math.abs(c - bestCost) <= eps;
      const betterDist = d + eps < bestDist;
      const tieDist = Math.abs(d - bestDist) <= eps;
      const betterRating = rating > bestRating;

      if (best === -1 || betterCost || (tieCost && (betterDist || (tieDist && betterRating)))) {
        best = j;
        bestCost = c;
        bestDist = d;
        bestRating = rating;
      }
    }
    used[best] = true;
    order.push(best);
  }
  return order;
}

export function twoOptImprove(
  coords: Coord[],
  order: number[],
  opts?: { maxIter?: number; mode?: Mode; weightMap?: Partial<Record<Mode, number>> }
): number[] {
  const maxIter = opts?.maxIter ?? 50;
  const mode = opts?.mode ?? "DRIVING";
  let ord = order.slice();
  let improved = true;
  let iter = 0;

  while (improved && iter++ < maxIter) {
    improved = false;
    for (let i = 1; i < ord.length - 2; i++) {
      for (let k = i + 1; k < ord.length - 1; k++) {
        const newOrd = ord.slice(0, i).concat(ord.slice(i, k + 1).reverse(), ord.slice(k + 1));
        if (tourLen(coords, newOrd, mode, opts?.weightMap) + 1e-6 < tourLen(coords, ord, mode, opts?.weightMap)) {
          ord = newOrd;
          improved = true;
        }
      }
    }
  }
  return ord;
}

/** 최적화: NN → 2-Opt. 이동수단 가중치 적용. */
export function optimizeOrder(
  coords: Coord[],
  opts?: { startIndex?: number; mode?: Mode; weightMap?: Partial<Record<Mode, number>>; maxIter?: number }
): number[] {
  if (coords.length <= 2) return coords.map((_, i) => i);
  const base = nearestNeighborOrder(coords, { startIndex: opts?.startIndex, mode: opts?.mode, weightMap: opts?.weightMap });
  return twoOptImprove(coords, base, { maxIter: opts?.maxIter, mode: opts?.mode, weightMap: opts?.weightMap });
}
