// apps/web/src/hooks/useTspOptimize.ts
/* 두옵트 반복 옵션 + 길이<3 메시지 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface TspPoint { id?: string; lat: number; lng: number; locked?: boolean; }
export interface OptimizeOptions { twoOptIterations?: number; }
export interface OptimizeResult { order: number[]; distanceMeters: number; message?: string }

type TspLib = Partial<{
  nearestNeighbor: (pts: TspPoint[], start?: number) => number[];
  twoOpt: (pts: TspPoint[], order: number[], maxIter?: number) => number[];
  distanceMeters: (a: TspPoint, b: TspPoint) => number;
}>;

function haversineMeters(a: TspPoint, b: TspPoint) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function nnOrder(pts: TspPoint[], start = 0) {
  const n = pts.length;
  const used = Array(n).fill(false);
  const order: number[] = [];
  let cur = start;
  for (let i = 0; i < n; i++) {
    order.push(cur);
    used[cur] = true;
    let best = -1, bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (used[j]) continue;
      const d = haversineMeters(pts[cur], pts[j]);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best === -1) break;
    cur = best;
  }
  return order;
}
function twoOpt(pts: TspPoint[], order: number[], maxIter = 2000) {
  const n = order.length;
  if (n < 4) return order.slice();
  const distIdx = (i: number, j: number) => haversineMeters(pts[order[i]], pts[order[j]]);
  let improved = true, iter = 0;
  const out = order.slice();
  while (improved && iter < maxIter) {
    improved = false; iter++;
    for (let i = 1; i < n - 2; i++) {
      for (let k = i + 1; k < n - 1; k++) {
        const a = out[i - 1], b = out[i], c = out[k], d = out[k + 1];
        const delta = haversineMeters(pts[a], pts[b]) + haversineMeters(pts[c], pts[d])
          - (haversineMeters(pts[a], pts[c]) + haversineMeters(pts[b], pts[d]));
        if (delta > 1e-6) {
          const rev = out.slice(i, k + 1).reverse();
          out.splice(i, rev.length, ...rev);
          improved = true;
        }
      }
    }
  }
  return out;
}
function pathLength(pts: TspPoint[], order: number[]) {
  let s = 0;
  for (let i = 0; i < order.length - 1; i++) s += haversineMeters(pts[order[i]], pts[order[i + 1]]);
  return s;
}

export function useTspOptimize() {
  const libRef = useRef<TspLib | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod: any = await import("@/utils/tsp").catch(() => null);
        if (mounted && mod) {
          libRef.current = {
            nearestNeighbor: mod.nearestNeighbor ?? mod.nnOrder ?? undefined,
            twoOpt: mod.twoOpt ?? undefined,
            distanceMeters: mod.distanceMeters ?? undefined,
          };
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const optimize = useCallback((points: TspPoint[], range?: { start: number; end: number }, opts?: OptimizeOptions): OptimizeResult => {
    const n = points.length;
    if (n === 0) return { order: [], distanceMeters: 0, message: "지점 없음" };
    if (n < 3) {
      const order = Array.from({ length: n }, (_, i) => i);
      return { order, distanceMeters: pathLength(points, order), message: "3개 미만은 최적화 불필요" };
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? n - 1;
    const s = Math.max(0, Math.min(start, n - 1));
    const e = Math.max(s, Math.min(end, n - 1));

    const head = points.slice(0, s);
    const mid = points.slice(s, e + 1);
    const tail = points.slice(e + 1);

    const fixedStart = mid[0]?.locked ?? true;
    const fixedEnd = mid[mid.length - 1]?.locked ?? true;

    const useLib = libRef.current;
    let midOrder = useLib?.nearestNeighbor ? useLib.nearestNeighbor(mid, 0) : nnOrder(mid, 0);
    const maxIter = opts?.twoOptIterations ?? 2000;
    midOrder = useLib?.twoOpt ? useLib.twoOpt(mid, midOrder, maxIter) : twoOpt(mid, midOrder, maxIter);

    if (fixedStart && midOrder[0] !== 0) {
      const idx = midOrder.indexOf(0);
      if (idx > 0) midOrder = [...midOrder.slice(idx), ...midOrder.slice(0, idx)];
    }
    if (fixedEnd && midOrder[midOrder.length - 1] !== mid.length - 1) {
      const flipped = midOrder.slice().reverse();
      if (flipped[flipped.length - 1] === mid.length - 1) midOrder = flipped;
    }

    const order: number[] = [];
    for (let i = 0; i < head.length; i++) order.push(i);
    const base = head.length;
    for (const idx of midOrder) order.push(base + idx);
    for (let i = 0; i < tail.length; i++) order.push(base + mid.length + i);

    const total = pathLength(points, order);
    return { order, distanceMeters: total };
  }, []);

  return { ready, optimize };
}
export default useTspOptimize;
