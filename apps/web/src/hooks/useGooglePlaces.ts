// src/hooks/useGooglePlaces.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

/** 검색 예측 항목(간소화) */
export type PlacePrediction = {
  placeId: string;
  description: string;
  primaryText?: string;
  secondaryText?: string;
  types?: string[];
};

/** 디테일 반환 모델(스토어 매핑 편의용) */
export type PlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress?: string;
  location?: { lat: number; lng: number };
  types?: string[];
};

export type UsePlacesOptions = {
  /** 자동완성 호출 디바운스(ms) */
  debounceMs?: number;
  /** 최소 입력 글자수(미만이면 호출 안함) */
  minLength?: number;
  /** 국가 제한(예: ['kr','vn']) */
  country?: string[];
  /** 언어/지역 옵션 */
  language?: string;
  region?: string;
  /** 결과 바이어싱 bounds (필터 아님) */
  biasBounds?: google.maps.LatLngBoundsLiteral | null;
};

/**
 * 텍스트 입력값에 따라 Google Places 예측을 제공하는 훅
 * - importLibrary('places') 기반으로 로드
 * - AutocompleteService + 세션 토큰 사용(청구 세션 묶기)
 * - getDetails 호출 시 필요한 fields만 요청(비용/지연 절감)
 */
export function usePlacesAutocomplete(
  input: string,
  opts: UsePlacesOptions = {}
): {
  ready: boolean;
  predictions: PlacePrediction[];
  loading: boolean;
  error: string | null;
  /** 현재 세션 토큰(있을 수도, 없을 수도) */
  sessionToken: google.maps.places.AutocompleteSessionToken | null;
  /** placeId로 상세 정보 요청 */
  getPlaceDetails: (
    placeId: string,
    fields?: Array<keyof google.maps.places.PlaceResult> | string[]
  ) => Promise<PlaceDetails>;
  /** 세션 종료(선택) */
  resetSession: () => void;
} {
  const options: Required<UsePlacesOptions> = {
    debounceMs: opts.debounceMs ?? 220,
    minLength: opts.minLength ?? 2,
    country: opts.country ?? ["kr", "vn"],
    language: opts.language ?? undefined,
    region: opts.region ?? undefined,
    biasBounds: opts.biasBounds ?? null,
  };

  // Places 라이브러리 준비 상태 (useGoogleMaps가 importLibrary를 내부에서 보장)
  const { ready, google } = useGoogleMaps(["places"]);

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autocomplete/Places 서비스 & 세션 토큰
  const serviceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // 서비스 준비
  useEffect(() => {
    if (!ready || !google) return;
    if (!serviceRef.current) {
      serviceRef.current = new google.maps.places.AutocompleteService();
    }
  }, [ready, google]);

  // 세션 토큰(입력 세션 단위 생성)
  const ensureSession = useCallback(() => {
    if (!google) return null;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, [google]);

  const clearSession = useCallback(() => {
    sessionTokenRef.current = null;
  }, []);

  // 예측 호출 디바운스
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!ready || !google || !serviceRef.current) return;

    const q = (input ?? "").trim();
    if (q.length < options.minLength) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setPredictions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      const token = ensureSession();
      const req: google.maps.places.AutocompletionRequest = {
        input: q,
        sessionToken: token ?? undefined,
        componentRestrictions: options.country?.length
          ? { country: options.country }
          : undefined, // 국가 제한(선택)
        bounds: options.biasBounds ?? undefined,
        language: options.language,
        // types / locationBias 등은 필요 시 확장
      };

      serviceRef.current!.getPlacePredictions(
        req,
        (res, status) => {
          // ZERO_RESULTS는 에러로 보지 않음
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !res
          ) {
            setPredictions([]);
            setLoading(false);
            if (
              status !==
              google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              setError(status?.toString?.() ?? "PREDICT_ERROR");
            }
            return;
          }

          const mapped: PlacePrediction[] = res.map((p) => ({
            placeId: p.place_id!,
            description: p.description ?? "",
            primaryText: p.structured_formatting?.main_text,
            secondaryText: p.structured_formatting?.secondary_text,
            types: p.types,
          }));
          setPredictions(mapped);
          setLoading(false);
        }
      );
    }, options.debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [
    input,
    ready,
    google,
    options.minLength,
    options.debounceMs,
    options.country?.join(","),
    options.language,
    options.biasBounds,
    ensureSession,
  ]);

  // 상세정보 조회(getDetails) — 필요한 필드만 요청
  const getPlaceDetails = useCallback<
    (
      placeId: string,
      fields?: Array<keyof google.maps.places.PlaceResult> | string[]
    ) => Promise<PlaceDetails>
  >(
    (placeId, fields) =>
      new Promise((resolve, reject) => {
        if (!ready || !google) {
          reject(new Error("Google Maps is not ready"));
          return;
        }
        // PlacesService 인스턴스는 맵이 없어도 DOM 노드 기반으로 생성 가능
        const dummy = document.createElement("div");
        const svc = new google.maps.places.PlacesService(dummy);

        const requested =
          (fields as string[]) ??
          ([
            "place_id",
            "name",
            "formatted_address",
            "geometry",
            "types",
          ] as string[]);

        const token = sessionTokenRef.current ?? undefined;

        svc.getDetails(
          {
            placeId,
            fields: requested as any,
            sessionToken: token,
            language: options.language,
          },
          (res, status) => {
            if (
              status !==
                google.maps.places.PlacesServiceStatus.OK ||
              !res
            ) {
              reject(
                new Error(
                  status?.toString?.() ?? "DETAILS_ERROR"
                )
              );
              return;
            }
            const loc = res.geometry?.location
              ? {
                  lat: res.geometry.location.lat(),
                  lng: res.geometry.location.lng(),
                }
              : undefined;

            // 디테일 조회까지 성공했으므로, 이 세션은 종료 → 다음 입력에서 새로 생성
            clearSession();

            resolve({
              placeId: res.place_id ?? placeId,
              name: res.name ?? "",
              formattedAddress: res.formatted_address,
              location: loc,
              types: res.types ?? [],
            });
          }
        );
      }),
    [ready, google, clearSession, options.language]
  );

  return {
    ready,
    predictions,
    loading,
    error,
    sessionToken: sessionTokenRef.current,
    getPlaceDetails,
    resetSession: clearSession,
  };
}
