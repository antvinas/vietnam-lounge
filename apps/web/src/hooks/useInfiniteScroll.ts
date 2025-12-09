import { useEffect, useRef } from "react";

type Options = {
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  onLoadMore: () => void | Promise<void>;
};

/**
 * IntersectionObserver 기반 무한스크롤 훅
 *
 * 사용법:
 * const loaderRef = useInfiniteScroll({ enabled, onLoadMore: fetchMore });
 * <div ref={loaderRef} />
 */
export default function useInfiniteScroll({
  enabled = true,
  root = null,
  rootMargin = "0px",
  threshold = 0.1,
  onLoadMore,
}: Options) {
  const ref = useRef<HTMLDivElement | null>(null);
  const cbRef = useRef(onLoadMore);

  // 최신 콜백 유지
  cbRef.current = onLoadMore;

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const target = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && cbRef.current) {
          cbRef.current();
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [enabled, root, rootMargin, threshold]);

  return ref;
}
