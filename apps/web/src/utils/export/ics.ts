// src/utils/export/ics.ts
// 정규화 스토어 타입으로 교체: Item → Block 별칭 사용
import type { Item as Block } from "@/features/plan/stores/plan.store";
import { maybeAddVTimezone } from "@/utils/export/vtimezone";

/** RFC 5545 TEXT 이스케이프 */
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** UTC yyyyMMdd'T'HHmmss'Z' */
const toUtc = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${h}${mi}${s}Z`;
};

export type IcsOptions = {
  /** TZID 예: "Asia/Bangkok". 지정해도 시간 필드는 기본 UTC 유지. */
  tzid?: string;
  /** VTIMEZONE 블록을 VCALENDAR에 포함 */
  includeVTimezone?: boolean;
  /** 설명에 경고 문구 포함 */
  includeNotice?: boolean;
};

export function buildICSFromBlocks(title: string, blocks: Block[], opts: IcsOptions = {}) {
  const now = toUtc(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//VN Lounge//Planner//EN",
  ];
  if (opts.tzid) lines.push(`X-WR-TIMEZONE:${opts.tzid}`);

  for (const b of blocks) {
    // 정규화 아이템에 start/end ISO가 없을 수 있음 → 존재하는 것만 내보냄
    const anyB = b as any;
    if (!anyB.start || !anyB.end) continue;

    const uid = `${(anyB.id || cryptoRandom())}@vnlounge`;
    const summary = esc(anyB.title || title || "Event");
    const loc = anyB.location
      ? esc(`${anyB.location.lat}, ${anyB.location.lng}`)
      : undefined;
    const desc = opts.includeNotice
      ? esc("Note: Times exported in UTC. Check your calendar's time zone settings.")
      : undefined;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${toUtc(anyB.start)}`,
      `DTEND:${toUtc(anyB.end)}`,
      `SUMMARY:${summary}`,
      loc ? `LOCATION:${loc}` : "",
      desc ? `DESCRIPTION:${desc}` : "",
      "END:VEVENT"
    );
    // 빈 라인 제거
    if (lines[lines.length - 3] === "") lines.splice(lines.length - 3, 1);
    if (lines[lines.length - 2] === "") lines.splice(lines.length - 2, 1);
  }

  lines.push("END:VCALENDAR");

  // CRLF로 합치고 필요 시 VTIMEZONE 삽입
  const ics = lines.join("\r\n");
  return opts.includeVTimezone && opts.tzid ? maybeAddVTimezone(ics, opts.tzid, false) : ics;
}

export function downloadICS(filename: string, ics: string) {
  const safe = filename.replace(/[\\/:*?"<>|]+/g, "_");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safe;
  a.click();
  URL.revokeObjectURL(url);
}

function cryptoRandom() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2);
}
