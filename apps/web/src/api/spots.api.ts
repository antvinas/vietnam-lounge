// apps/web/src/api/spots.api.ts
/**
 * @deprecated
 * 새로운 스팟 도메인 API는 "@/api/spot" 를 사용하세요.
 * 이 파일은 레거시 호환(re-export) 용입니다.
 */

// 기존에 쓰던 이름들을 그대로 유지하기 위해 전부 re-export
export * from "./spot";

// 과거 spotsApi.getSpots 형태를 쓰는 코드가 있을 수 있어서 호환 객체 제공
import type { GetSpotsParams, GetSpotsResult } from "./spot";
import { getSpots } from "./spot";

export const spotsApi = {
  getSpots: (params: GetSpotsParams): Promise<GetSpotsResult> => getSpots(params),
};

// 예전 export 이름도 유지
export const fetchSpots = spotsApi.getSpots;
