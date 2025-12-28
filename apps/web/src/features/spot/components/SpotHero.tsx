// src/components/spots/SpotHero.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Spot, SpotImage } from "@/types/spot";
import { FiChevronLeft, FiHeart, FiShare2 } from "react-icons/fi";
import SpotActionBar from "@/features/spot/components/detail/SpotActionBar";

type Props = {
  spot: Spot;
  isFavorited: boolean;
  onFavoriteToggle: () => void;
  mode: "explorer" | "nightlife";
  galleryImages?: string[];
};

const PLACEHOLDER = import.meta.env.BASE_URL + "placeholders/spot.jpg";

function pickFirstImage(images?: SpotImage[] | null) {
  const first = images?.[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "url" in first) return (first as any).url as string;
  return null;
}

/**
 * 히어로는 LCP 후보. eager + fetchpriority="high" 권장.
 * width/height 지정으로 CLS 방지.
 */
export default function SpotHero({ spot, isFavorited, onFavoriteToggle, galleryImages = [] }: Props) {
  const navigate = useNavigate();

  const cover = useMemo(() => {
    const firstFromSpot =
      (spot as any)?.heroImage ||
      (spot as any)?.imageUrl ||
      (spot as any)?.imageUrls?.[0] ||
      pickFirstImage((spot as any)?.images);

    return firstFromSpot || galleryImages[0] || PLACEHOLDER;
  }, [spot, galleryImages]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: (spot as any)?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("링크가 복사되었습니다.");
      }
    } catch {
      // ignore
    }
  };

  return (
    <header className="relative">
      {/* Hero image */}
      <div className="relative h-[320px] w-full overflow-hidden md:h-[420px] lg:h-[460px]">
        <img
          src={cover}
          alt={`${(spot as any)?.name} 대표 이미지`}
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
          // @ts-expect-error experimental attribute pass-through
          fetchpriority="high"
          sizes="(min-width:1280px) 1280px, 100vw"
          width={1600}
          height={900}
          onError={(e) => {
            const t = e.currentTarget as HTMLImageElement;
            if (t.src !== PLACEHOLDER) t.src = PLACEHOLDER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Top controls */}
        <div className="absolute left-0 right-0 top-0 mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 md:px-10 lg:px-20">
          <button
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur hover:bg-black/60"
          >
            <FiChevronLeft /> 뒤로
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={share}
              aria-label="공유"
              className="rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
            >
              <FiShare2 />
            </button>
            <button
              onClick={onFavoriteToggle}
              aria-label={isFavorited ? "관심 해제" : "관심 등록"}
              className={`rounded-full p-2 backdrop-blur ${
                isFavorited ? "bg-primary text-white" : "bg-black/40 text-white hover:bg-black/60"
              }`}
            >
              <FiHeart />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-screen-xl px-4 pb-6 md:px-10 lg:px-20">
          <div className="max-w-3xl">
            {(spot as any)?.category && (
              <div className="mb-2 inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {(spot as any).category}
              </div>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
              {(spot as any)?.name}
            </h1>
            {(spot as any)?.address && (
              <p className="mt-2 text-sm text-white/80">{(spot as any).address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="-mt-6 mx-auto max-w-screen-xl px-4 md:px-10 lg:px-20">
        <SpotActionBar spot={spot} className="flex gap-2" />
      </div>
    </header>
  );
}
