/* VTIMEZONE 유틸. DST 없는 TZ(예: Asia/Bangkok)는 STANDARD만 생성.
   TZID마다 VTIMEZONE 하나가 필요. 필요 시 UTC만 사용하도록 선택. */

function pad(n: number, w = 2) {
  return n.toString().padStart(w, "0");
}
function ymdHis(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes()
  )}${pad(d.getUTCSeconds())}Z`;
}
function offsetMinutes(tz: string, at: Date): number {
  // Intl 기반 오프셋 추정
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(at);
  const Y = Number(parts.find((p) => p.type === "year")?.value);
  const M = Number(parts.find((p) => p.type === "month")?.value);
  const D = Number(parts.find((p) => p.type === "day")?.value);
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  const s = Number(parts.find((p) => p.type === "second")?.value);
  const asUTC = Date.UTC(Y, M - 1, D, h, m, s);
  return Math.round((asUTC - at.getTime()) / 60000);
}
function fmtOffset(mins: number) {
  const sign = mins >= 0 ? "+" : "-";
  const a = Math.abs(mins);
  const hh = Math.floor(a / 60);
  const mm = a % 60;
  return `${sign}${pad(hh)}${pad(mm)}`;
}

/** DST 없는 지역용 VTIMEZONE */
export function buildSimpleVTimezone(tzid: string, sampleYear = new Date().getUTCFullYear()) {
  const jan = new Date(Date.UTC(sampleYear, 0, 1, 0, 0, 0));
  const jul = new Date(Date.UTC(sampleYear, 6, 1, 0, 0, 0));
  const offJan = offsetMinutes(tzid, jan);
  const offJul = offsetMinutes(tzid, jul);

  if (offJan !== offJul) {
    // DST 존재. 정확한 RRULE 생성을 원하면 타임존 DB 내장 또는 사전 정의가 필요.
    // 임시로 STANDARD(1월)만 생성하거나, 전체를 UTC로 내보내는 것을 권장.
    return `BEGIN:VTIMEZONE
TZID:${tzid}
BEGIN:STANDARD
TZOFFSETFROM:${fmtOffset(offJan)}
TZOFFSETTO:${fmtOffset(offJan)}
TZNAME:${fmtOffset(offJan)}
DTSTART:${sampleYear}0101T000000
END:STANDARD
END:VTIMEZONE`;
  }

  return `BEGIN:VTIMEZONE
TZID:${tzid}
BEGIN:STANDARD
TZOFFSETFROM:${fmtOffset(offJan)}
TZOFFSETTO:${fmtOffset(offJan)}
TZNAME:${fmtOffset(offJan)}
DTSTART:${sampleYear}0101T000000
END:STANDARD
END:VTIMEZONE`;
}

/** VCALENDAR에 VTIMEZONE 삽입. forceUTC면 그대로 반환 */
export function maybeAddVTimezone(ics: string, tzid?: string, forceUTC = false) {
  if (!tzid || forceUTC) return ics;
  const year = new Date().getUTCFullYear();
  const vtz = buildSimpleVTimezone(tzid, year);
  // 이미 들어가 있으면 그대로
  if (ics.includes("BEGIN:VTIMEZONE")) return ics;
  return ics.replace("BEGIN:VCALENDAR", `BEGIN:VCALENDAR\r\n${vtz}`);
}

/** UTC 강제 내보내기 도우미: 로컬시간 라인 대신 Z 접미 UTC 사용 권장 */
export function toUtcStamp(d: Date) {
  return ymdHis(d);
}
