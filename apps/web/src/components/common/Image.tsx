// src/components/common/Image.tsx
import { ImgHTMLAttributes, useMemo, useState } from "react";

interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackAlt?: string;
  showSkeleton?: boolean;
  sizes?: string;
  srcSet?: string;
  /**
   * 레이아웃 힌트. width/height가 없을 때 wrapper에 적용.
   * 예:  "4/3" 또는 1.7778
   */
  aspectRatio?: `${number}/${number}` | number;
}

/**
 * 공통 Image
 * - 기본 lazy + decoding=async
 * - width/height를 주면 그 값으로 고정 비율 확보
 * - 없으면 wrapper에 aspect-ratio를 적용해 CLS 예방
 *   (이미지 치수 또는 비율 제공은 CLS 개선의 핵심) :contentReference[oaicite:5]{index=5}
 */
export default function Image({
  fallbackAlt = "이미지",
  showSkeleton = true,
  className = "",
  alt,
  loading = "lazy",
  decoding = "async",
  sizes,
  srcSet,
  aspectRatio,
  width,
  height,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  // wrapper style에서 aspect-ratio 제공
  const wrapperStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (width && height) return undefined; // 고유 치수로 비율 확보됨
    if (aspectRatio) {
      if (typeof aspectRatio === "number") return { aspectRatio };
      // "w/h" 형태
      const [w, h] = aspectRatio.split("/").map(Number);
      if (w > 0 && h > 0) return { aspectRatio: w / h };
    }
    // 기본 4:3 비율
    return { aspectRatio: 4 / 3 };
  }, [aspectRatio, width, height]);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={wrapperStyle}>
      {showSkeleton && !loaded && (
        <div className="absolute inset-0 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      )}
      <img
        {...props}
        alt={alt || fallbackAlt}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
        srcSet={srcSet}
        width={width}
        height={height}
        onLoad={(e) => {
          setLoaded(true);
          props.onLoad?.(e);
        }}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${props.className || ""}`}
      />
    </div>
  );
}
