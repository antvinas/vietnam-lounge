/**
 * 객체에서 값이 `undefined`인 키를 재귀적으로 제거합니다.
 * Firestore는 `undefined` 값을 저장할 수 없으므로, API 요청 전 이 함수를 사용하여 데이터를 정리해야 합니다.
 *
 * @param obj 정제할 객체
 * @returns undefined가 제거된 객체
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => cleanUndefined(v)) as unknown as T;
  }

  return Object.entries(obj as Record<string, any>).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = cleanUndefined(value);
    }
    return acc;
  }, {} as Record<string, any>) as T;
}