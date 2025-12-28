// apps/web/src/components/common/Image.tsx
import React, { useEffect, useState } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
  /** true면 fallback으로 바뀐 상태를 data 속성으로 남김(관리자 UI 디버그용) */
  markFallback?: boolean;
};

export default function Image({
  src,
  alt,
  fallbackSrc = "/placeholder.png",
  markFallback = false,
  onError,
  ...rest
}: Props) {
  const [hasError, setHasError] = useState(false);

  // src가 바뀌면 에러 상태 리셋
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const finalSrc = !src || hasError ? fallbackSrc : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      data-fallback={markFallback ? String(!src || hasError) : undefined}
      onError={(e) => {
        // fallbackSrc도 깨질 수 있으니 무한루프 방지
        if (!hasError) setHasError(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
