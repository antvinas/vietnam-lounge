// apps/web/src/features/spot/components/SpotSponsoredSlider.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "@/styles/spotAds.css";
import * as SpotApi from "@/api/spot";
import { FaMoneyBillWave } from "react-icons/fa";
import { getSpotPriceDisplay } from "@/constants/filters";

type Spot = {
  id: string;
  name: string;
  images?: string[];
  heroImage?: string;
  imageUrls?: string[];
  sponsorLabel?: "추천" | "협찬" | "Partner" | string;

  // ✅ 예산/가격대(옵셔널: 백엔드 내려오는 형태가 다양하므로 안전하게 처리)
  budget?: number;
  budgetUnit?: string;
  budgetText?: string;
  priceLevel?: number;
};

type Props = {
  title?: string;
  spots?: Spot[];
  itemWidth?: number;
  gap?: number;
  mode?: "explorer" | "nightlife";
};

async function fetchSliderSpots(mode?: "explorer" | "nightlife"): Promise<Spot[]> {
  const mod: any = SpotApi as any;
  const fn = mod.getSponsoredSpots || mod.fetchSponsoredSpots || mod.fetchSponsorSpots;
  if (!fn) return [];

  try {
    const res = await fn(mode ?? "explorer", 10);
    return Array.isArray(res) ? res.slice(0, 10) : [];
  } catch {
    try {
      const res = await fn({ mode: mode ?? "explorer", take: 10 });
      return Array.isArray(res) ? res.slice(0, 10) : [];
    } catch {
      return [];
    }
  }
}

export default function SpotSponsoredSlider({
  title = "💎 협찬 스팟",
  spots,
  itemWidth = 220,
  gap = 12,
  mode = "explorer",
}: Props) {
  const [data, setData] = useState<Spot[]>(spots ?? []);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    if (!spots || spots.length === 0) {
      fetchSliderSpots(mode).then((res) => {
        if (alive) setData(res);
      });
    }
    return () => {
      alive = false;
    };
  }, [spots, mode]);

  if (data.length === 0) return null;

  const base = mode === "nightlife" ? "/adult/spots" : "/spots";

  return (
    <section aria-label="협찬 스팟 슬라이더" className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">
          <span className="sponsor-badge mr-2 inline-block align-middle">협찬</span>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            aria-label="왼쪽으로 스크롤"
            className="rounded-full bg-black/10 px-2 py-1 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
            onClick={() => scroller.current?.scrollBy({ left: -itemWidth - gap, behavior: "smooth" })}
          >
            ‹
          </button>
          <button
            aria-label="오른쪽으로 스크롤"
            className="rounded-full bg-black/10 px-2 py-1 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
            onClick={() => scroller.current?.scrollBy({ left: itemWidth + gap, behavior: "smooth" })}
          >
            ›
          </button>
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar flex overflow-x-auto scroll-smooth" style={{ gap }}>
        {data.map((spot) => (
          <SliderCard key={spot.id} spot={spot} width={itemWidth} hrefBase={base} />
        ))}
      </div>
    </section>
  );
}

function SliderCard({ spot, width, hrefBase }: { spot: Spot; width: number; hrefBase: string }) {
  const img = spot.heroImage || spot.images?.[0] || spot.imageUrls?.[0] || "";

  // ✅ 단일 소스: 예산 우선 → priceLevel fallback
  const price = getSpotPriceDisplay(spot as any);

  return (
    <article
      className="premium-glow relative shrink-0 rounded-xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
      style={{ width }}
    >
      <div className="sponsor-badge absolute left-2 top-2 z-10">{spot.sponsorLabel || "추천"}</div>
      <Link to={`${hrefBase}/${spot.id}`} className="block">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-xl">
          <img
            loading="lazy"
            src={img}
            alt={spot.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          />
        </div>
        <div className="p-3">
          <h4 className="line-clamp-1 text-sm font-semibold">{spot.name}</h4>

          {/* ✅ 예산/가격대 */}
          {price.primary ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-200">
              <FaMoneyBillWave className="text-zinc-400" />
              <span className="font-semibold">{price.primary}</span>
            </div>
          ) : (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">협찬 스팟 상세 보러가기</p>
          )}

          {price.secondary ? (
            <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">{price.secondary}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
