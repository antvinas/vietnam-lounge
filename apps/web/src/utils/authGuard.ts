/**
 * Nightlife 접근 차단 유틸
 * - 게이트 통과 전이면 /nightlife/gate 로 리디렉션
 */
export function guardNightlife(isGatePassed: boolean, pathname: string): string | null {
  if (!isGatePassed && pathname.startsWith("/nightlife") && pathname !== "/nightlife/gate") {
    return "/nightlife/gate";
  }
  return null;
}
