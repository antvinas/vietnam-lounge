/**
 * Google Places OpeningHours(periods) 기반 단순 영업시간 판정.
 * - periods: [{open:{day,time}, close:{day,time}}]
 * - day: 0=일요일, ... 6=토요일
 * - time: "HHMM" (로컬 시간 기준)
 */

export type Period = google.maps.places.PlaceOpeningHoursPeriod;
export type Periods = Period[] | undefined;

function toHHMM(d: Date, utcOffsetMinutes?: number) {
  // 장소 현지 시각으로 보정
  const ms = d.getTime() + (utcOffsetMinutes ?? 0) * 60_000 - d.getTimezoneOffset() * 60_000;
  const local = new Date(ms);
  const hh = String(local.getHours()).padStart(2, "0");
  const mm = String(local.getMinutes()).padStart(2, "0");
  return { hhmm: `${hh}${mm}`, day: local.getDay() as 0|1|2|3|4|5|6 };
}

/** 특정 시각에 영업 중인지 */
export function isOpenAt(
  periods: Periods,
  at: Date,
  utcOffsetMinutes?: number
): boolean | undefined {
  if (!periods?.length) return undefined;
  const { hhmm, day } = toHHMM(at, utcOffsetMinutes);

  // 해당 요일의 모든 구간 확인
  for (const p of periods) {
    const o = p.open;
    const c = p.close;
    if (!o || !c || typeof o.day !== "number" || typeof c.day !== "number") continue;
    if (o.day === c.day) {
      if (o.day === day && o.time && c.time && o.time <= hhmm && hhmm < c.time) {
        return true;
      }
    } else {
      // 자정 넘김 케이스: open.day==day && time<=hhmm 또는 c.day==day && hhmm<c.time
      if (o.day === day && o.time && o.time <= hhmm) return true;
      if (c.day === day && c.time && hhmm < c.time) return true;
    }
  }
  // 명시적으로 false일 수 있으나, 데이터가 불완전하면 false 반환
  return false;
}

/** 일정 충돌 탐지: 시작/종료 시각 중 하나라도 영업 외면 경고 */
export function detectOpeningConflicts(
  items: Array<{
    openingPeriods?: Periods;
    utcOffsetMinutes?: number;
    start: Date;
    durationMin: number;
  }>
): number[] {
  const conflicts: number[] = [];
  items.forEach((it, idx) => {
    const end = new Date(it.start.getTime() + it.durationMin * 60_000);
    const openAtStart = isOpenAt(it.openingPeriods, it.start, it.utcOffsetMinutes);
    const openAtEnd = isOpenAt(it.openingPeriods, end, it.utcOffsetMinutes);
    if (openAtStart === false || openAtEnd === false) conflicts.push(idx);
  });
  return conflicts;
}
