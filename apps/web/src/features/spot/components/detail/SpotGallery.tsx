// src/components/spots/detail/SpotGallery.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

type Props = {
  images?: string[];
  cover?: string;
  spotName?: string;
  className?: string;
  initialIndex?: number;
};

const PLACEHOLDER = import.meta.env.BASE_URL + "placeholders/spot.jpg";

/**
 * 메인 미디어: aspect-[16/9] + width/height + fetchpriority="high"
 * 썸네일: 고정 크기(width/height)로 CLS 무효화, lazy
 * LCP 후보는 eager + fetchpriority, 그 외 이미지는 lazy가 권장. :contentReference[oaicite:2]{index=2}
 */
export default function SpotGallery({
  images = [],
  cover,
  spotName = "스팟",
  className = "",
  initialIndex = 0,
}: Props) {
  const gallery = useMemo(() => {
    const list = [cover, ...images].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [cover, images]);

  const [index, setIndex] = useState<number>(
    Math.min(Math.max(initialIndex, 0), Math.max(gallery.length - 1, 0))
  );

  useEffect(() => {
    setIndex((prev) => Math.min(prev, Math.max(gallery.length - 1, 0)));
  }, [gallery.length]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, gallery.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    },
    [gallery.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const main = gallery[index] ?? PLACEHOLDER;

  if (gallery.length === 0) {
    return (
      <section className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-100">사진</h3>
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-900/40">
          <img
            src={PLACEHOLDER}
            alt="플레이스홀더 이미지"
            className="h-full w-full object-cover opacity-50"
            loading="lazy"
            decoding="async"
            width={1600}
            height={900}
          />
        </div>
        <p className="mt-2 text-sm text-slate-300">아직 등록된 사진이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`}>
      <h3 className="mb-3 text-base font-semibold text-slate-100">사진</h3>

      <PhotoProvider>
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-900/40">
          <PhotoView src={main}>
            <img
              src={main}
              alt={`${spotName} 사진 ${index + 1}`}
              className="h-full w-full cursor-zoom-in object-cover"
              loading="eager"
              decoding="async"
              // @ts-expect-error experimental attribute pass-through
              fetchpriority="high"
              sizes="(min-width:1024px) 900px, 100vw"
              width={1600}
              height={900}
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (t.src !== PLACEHOLDER) t.src = PLACEHOLDER;
              }}
            />
          </PhotoView>
        </div>

        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          role="listbox"
          aria-label="사진 썸네일"
        >
          {gallery.map((src, i) => {
            const selected = i === index;
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-selected={selected}
                aria-current={selected ? "true" : undefined}
                className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border ${
                  selected ? "border-primary ring-2 ring-primary/40" : "border-slate-700"
                }`}
              >
                <img
                  src={src}
                  alt={`${spotName} 썸네일 ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  sizes="96px"
                  width={96}
                  height={64}
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (t.src !== PLACEHOLDER) t.src = PLACEHOLDER;
                  }}
                />
              </button>
            );
          })}
        </div>
      </PhotoProvider>
    </section>
  );
}
