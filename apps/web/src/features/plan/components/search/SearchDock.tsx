// src/components/plan/SearchDock.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import DualPlaceSearch from "@/features/plan/components/search/DualPlaceSearch";
import SearchAutocomplete from "@/features/plan/components/search/SearchAutocomplete";
import SearchResultList from "@/features/plan/components/search/SearchResultList";
import { usePlacesAutocomplete } from "@/hooks/useGooglePlaces";
import { useRouteStore } from "@/store/useRouteStore";
import useDistanceMatrix from "@/hooks/useDistanceMatrix";

type LatLng = google.maps.LatLngLiteral;

type PlaceLite = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  photoUrl?: string;
  distanceKm?: number;
  etaMin?: number;
};

export default function SearchDock({
  height = 560,
}: {
  height?: number;
}) {
  const route = useRouteStore();
  const [center, setCenter] = useState<LatLng>({
    lat: 21.0278,
    lng: 105.8342,
  });

  // 텍스트 검색
  const [query, setQuery] = useState("");
  const { predictions } = usePlacesAutocomplete(query, {
    debounceMs: 200,
  });

  // PlacesService 재사용
  const placesSvcRef =
    useRef<google.maps.places.PlacesService | null>(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const g = (window as any).google;
      if (!g?.maps?.importLibrary) return;
      await g.maps.importLibrary("places");
      if (cancel) return;
      if (!placesSvcRef.current) {
        const div = document.createElement("div");
        placesSvcRef.current = new g.maps.places.PlacesService(div);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const [items, setItems] = useState<PlaceLite[]>([]);
  const reqIdRef = useRef(0);

  const runSearch = useMemo(
    () =>
      debounce((q: string) => {
        const runId = ++reqIdRef.current;
        if (!q?.trim()) {
          setItems([]);
          return;
        }
        const svc = placesSvcRef.current;
        const g = (window as any).google;
        if (!svc || !g) return;

        const req: google.maps.places.TextSearchRequest = {
          query: q,
        };
        svc.textSearch(req, (res, status) => {
          if (runId !== reqIdRef.current) return;
          if (
            status !== g.maps.places.PlacesServiceStatus.OK ||
            !res
          ) {
            setItems([]);
            return;
          }
          const list: PlaceLite[] = res.slice(0, 20).map((p) => ({
            id: p.place_id!,
            name: p.name!,
            lat:
              p.geometry?.location?.lat() ??
              center.lat,
            lng:
              p.geometry?.location?.lng() ??
              center.lng,
            address: p.formatted_address,
            rating: p.rating,
            photoUrl:
              p.photos?.[0]?.getUrl?.({
                maxWidth: 320,
              }),
          }));
          setItems(list);
          if (list[0])
            setCenter({
              lat: list[0].lat,
              lng: list[0].lng,
            });
        });
      }, 250),
    [center.lat, center.lng]
  );

  useEffect(
    () => runSearch(query),
    [query, runSearch]
  );

  // 거리/ETA 배치 계산
  const origin = route.start?.location ?? center;
  const dm = useDistanceMatrix({
    origins: [origin],
    destinations: items.map((i) => ({
      lat: i.lat,
      lng: i.lng,
    })),
    mode: "DRIVING",
    departureTime: new Date(),
  });

  const enriched: PlaceLite[] = useMemo(() => {
    if (!dm.matrix?.[0]) return items;
    return items.map((it, idx) => {
      const cell = dm.matrix![0][idx];
      return {
        ...it,
        distanceKm: cell?.distanceKm,
        etaMin: cell?.durationMin,
      };
    });
  }, [items, dm.matrix]);

  // 정렬: 거리 -> ETA -> 평점
  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      const d =
        (a.distanceKm ??
          Number.POSITIVE_INFINITY) -
        (b.distanceKm ??
          Number.POSITIVE_INFINITY);
      if (d !== 0) return d;
      const t =
        (a.etaMin ??
          Number.POSITIVE_INFINITY) -
        (b.etaMin ??
          Number.POSITIVE_INFINITY);
      if (t !== 0) return t;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  }, [enriched]);

  return (
    <aside
      className="panel-surface"
      style={{ height }}
      aria-label="검색 패널"
    >
      <div className="flex h-full flex-col">
        <div className="p-3">
          <DualPlaceSearch />
        </div>

        <div className="px-3 pb-2">
          <label className="mb-1 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
            장소 검색
          </label>
          <SearchAutocomplete
            value={query}
            onChange={setQuery}
            onSubmit={setQuery}
            onSelect={(s) => setQuery(s.primary)}
            suggestions={predictions.map((p) => ({
              id: p.placeId,
              primary: p.primaryText || p.description,
              secondary: p.secondaryText,
              raw: p,
            }))}
            placeholder="예: 롯데호텔, 카페, 박물관"
            className="" /* 포털로 분리되어 ac-root 불필요 */
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3 pt-0">
          <SearchResultList
            items={sorted}
            origin={origin}
            onAdd={() => {}}
            onAddToDay={() => {}}
            onDirections={(p: any) =>
              setCenter({ lat: p.lat, lng: p.lng })
            }
            onSetStart={(p) =>
              route.setStart({
                placeId: p.id,
                label: p.name,
                location: {
                  lat: p.lat,
                  lng: p.lng,
                },
              })
            }
            onSetEnd={(p) =>
              route.setEnd({
                placeId: p.id,
                label: p.name,
                location: {
                  lat: p.lat,
                  lng: p.lng,
                },
              })
            }
          />
        </div>
      </div>
    </aside>
  );
}

function debounce<A extends any[]>(
  fn: (...a: A) => void,
  ms: number
) {
  let t: number | undefined;
  return (...a: A) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...a), ms);
  };
}
