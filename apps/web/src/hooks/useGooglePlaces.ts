// src/hooks/useGooglePlaces.ts

import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import type { PlacePrediction, GooglePlace } from "@/types/googlePlaces";

// 과거 코드 호환용: PlaceDetails 이름을 쓰던 코드가 있다면 그대로 동작하도록
export type PlaceDetails = GooglePlace;

export interface UsePlacesAutocompleteOptions {
  debounceMs?: number;
}

/**
 * Google Places Text Autocomplete 전용 훅
 *
 * - query 문자열과 debounce 옵션을 받아서
 * - 우리 앱 공통 타입인 PlacePrediction[] 을 반환
 *
 * NOTE:
 * - 디테일 조회(getDetails)는 현재 SearchDock 쪽에서
 *   PlacesService 를 직접 사용하고 있으므로 여기선 다루지 않는다.
 */
export function usePlacesAutocomplete(
  query: string,
  options: UsePlacesAutocompleteOptions = {}
) {
  const { google } = useGoogleMaps({ libraries: ["places"] });

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const serviceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  // AutocompleteService 준비
  useEffect(() => {
    if (!google) return;
    if (!serviceRef.current) {
      serviceRef.current = new google.maps.places.AutocompleteService();
    }
  }, [google]);

  // query 변경 시 예측 실행
  useEffect(() => {
    const trimmed = query?.trim();

    if (!trimmed || !google || !serviceRef.current) {
      setPredictions([]);
      return;
    }

    const delay = options.debounceMs ?? 0;

    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      serviceRef.current!.getPlacePredictions(
        {
          input: trimmed,
        },
        (results) => {
          if (!results || !results.length) {
            setPredictions([]);
            return;
          }

          const mapped: PlacePrediction[] = results.map((r) => ({
            placeId: r.place_id!,
            description: r.description ?? "",
            primaryText:
              r.structured_formatting?.main_text ?? undefined,
            secondaryText:
              r.structured_formatting?.secondary_text ?? undefined,
            types: r.types ?? [],
          }));

          setPredictions(mapped);
        }
      );
    }, delay);

    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [google, query, options.debounceMs]);

  return { predictions };
}
