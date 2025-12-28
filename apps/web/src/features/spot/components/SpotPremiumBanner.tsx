// apps/web/src/features/spot/components/SpotPremiumBanner.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import "@/styles/spotAds.css";
import * as SpotApi from "@/api/spot";

type Spot = {
  id: string;
  name: string;
  images?: string[];
  heroImage?: string;
  imageUrls?: string[];
  description?: string;
  sponsorLabel?: "추천" | "협찬" | "Partner" | string;
  mode?: "explorer" | "nightlife";
};

type Props = {
  spots?: Spot[];
  autoPlayMs?: number;
  height?: number;
  mode?: "explorer" | "nightlife";
};

async function fetchBannerSpots(mode?: "explorer" | "nightlife"): Promise<Spot[]> {
  const mod: any = SpotApi as any;
  const fn = mod.getSponsoredSpots || mod.fetchSponsoredSpots || mod.fetchSponsorSpots;
  if (!fn) return [];

  try {
    const res = await fn(mode ?? "explorer", 10);
    return Array.isArray(res) ? res : [];
  } catch {
    try {
      const res = await fn({ mode: mode ?? "explorer", take: 10 });
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }
}

export default function SpotPremiumBanner({ spots, autoPlayMs = 4000, height = 240, mode }: Props) {
  const [data, setData] = useState<Spot[]>(spots ?? []);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    let alive = true;
    if (!spots || spots.length === 0) {
      fetchBannerSpots(mode).then((res) => {
        if (alive) setData(res.slice(0, 5));
      });
    }
    return () => {
      alive = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [spots, mode]);

  useEffect(() => {
    if (data.length <= 1) return;
    timerRef.current && window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (hoverRef.current) return;
      setIdx((p) => (p + 1) % data.length);
    }, autoPlayMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [data.length, autoPlayMs]);

  const railStyle: CSSProperties = useMemo(
    () => ({
      width: `${data.length * 100}%`,
      transform: `translateX(-${(100 / data.length) * idx}%)`,
      transition: "transform 600ms ease",
      height,
    }),
    [data.length, idx, height]
  );

  if (data.length === 0) return null;

  const base = mode === "nightlife" ? "/adult/spots" : "/spots";

  return (
    <section
      className="premium-glow relative w-full overflow-hidden rounded-2xl"
      style={{ height }}
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
      aria-label="프리미엄 추천 배너"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
      <div className="flex h-full" style={railStyle}>
        {data.map((spot) => (
          <BannerSlide key={spot.id} spot={spot} height={height} base={base} />
        ))}
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {data.map((_, i) => (
          <button
            key={i}
            aria-label={`배너 ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full transition-all ${i === idx ? "w-6 bg-amber-400" : "bg-white/60 hover:bg-white"}`}
          />
        ))}
      </div>

      <div className="absolute inset-y-0 left-0 flex items-center">
        <button
          aria-label="이전 배너"
          onClick={() => setIdx((p) => (p - 1 + data.length) % data.length)}
          className="m-2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
        >
          ‹
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          aria-label="다음 배너"
          onClick={() => setIdx((p) => (p + 1) % data.length)}
          className="m-2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
        >
          ›
        </button>
      </div>
    </section>
  );
}

function BannerSlide({ spot, height, base }: { spot: Spot; height: number; base: string }) {
  const img = spot.heroImage || spot.images?.[0] || spot.imageUrls?.[0] || "";
  return (
    <article className="relative h-full w-full shrink-0" style={{ height }} role="group" aria-roledescription="premium banner">
      <img src={img} alt={spot.name} loading="lazy" className="h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 flex items-end">
        <div className="m-4 max-w-[70%] rounded-xl bg-black/45 p-4 text-white backdrop-blur">
          <div className="sponsor-badge mb-2">{spot.sponsorLabel || "추천 스팟"}</div>
          <h3 className="text-xl font-bold leading-tight">{spot.name}</h3>
          {spot.description && <p className="mt-1 line-clamp-2 text-sm opacity-90">{spot.description}</p>}
          <div className="mt-3">
            <Link
              to={`${base}/${spot.id}`}
              className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              자세히 보기
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
