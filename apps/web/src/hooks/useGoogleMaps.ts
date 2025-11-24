// src/hooks/useGoogleMaps.ts
// - js-api-loader 옵션·싱글턴은 src/lib/googleMaps.ts가 담당
// - 여기선 필요한 라이브러리만 선언적으로 요청
import { useEffect, useState } from "react";
import { ready } from "@/lib/googleMaps";

type LibName = "maps" | "places" | "marker" | "geometry";

/** Maps JS API 동적 로더 래퍼 훅 (importLibrary 기반) */
export function useGoogleMaps(libraries: LibName[] = ["maps"]) {
  const [isReady, setIsReady] = useState(false);
  const [googleNS, setGoogleNS] = useState<typeof google | null>(null);

  useEffect(() => {
    let cancelled = false;
    const withPlaces = libraries.includes("places");
    const withMarker = libraries.includes("marker") || libraries.includes("geometry");

    ready({ withPlaces, withMarker })
      .then((g) => {
        if (!cancelled) {
          setGoogleNS(g);
          setIsReady(true);
        }
      })
      .catch((e) => {
        console.error("Failed to load Google Maps:", e);
      });

    return () => {
      cancelled = true;
    };
  }, [libraries.join(",")]);

  return { ready: isReady, google: googleNS as any };
}

export default useGoogleMaps;
