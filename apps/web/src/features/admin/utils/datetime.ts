// apps/web/src/features/admin/utils/datetime.ts
// ✅ Admin 화면에서 Firestore Timestamp / ISO / YYYY-MM-DD 혼재를 "사람이 읽는 날짜"로 통일하기 위한 유틸

export type DateInput =
  | Date
  | string
  | number
  | null
  | undefined
  | {
      // Firestore Timestamp 호환
      seconds?: number;
      nanoseconds?: number;
      toDate?: () => Date;
    };

export function isValidDate(d: any): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/**
 * Firestore Timestamp / epoch / Date / 문자열을 Date로 변환
 * - Timestamp(toDate) 우선
 * - {seconds} 형태도 지원
 * - 문자열은 Date.parse 가능한 경우만
 */
export function toDateMaybe(input: DateInput): Date | null {
  if (!input) return null;

  if (input instanceof Date) return isValidDate(input) ? input : null;

  // Firestore Timestamp
  if (typeof input === "object") {
    const anyObj: any = input as any;
    if (typeof anyObj.toDate === "function") {
      try {
        const d = anyObj.toDate();
        return isValidDate(d) ? d : null;
      } catch {
        // ignore
      }
    }

    // seconds / nanoseconds
    const sec = Number(anyObj.seconds);
    if (Number.isFinite(sec)) {
      const ns = Number(anyObj.nanoseconds);
      const ms = sec * 1000 + (Number.isFinite(ns) ? Math.floor(ns / 1e6) : 0);
      const d = new Date(ms);
      return isValidDate(d) ? d : null;
    }
  }

  // epoch millis
  if (typeof input === "number") {
    const d = new Date(input);
    return isValidDate(d) ? d : null;
  }

  // string
  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;

    // YYYY-MM-DD 는 로컬 날짜로 파싱(UTC 오프셋으로 하루 밀리는 문제 방지)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map((x) => Number(x));
      const dt = new Date(y, m - 1, d);
      return isValidDate(dt) ? dt : null;
    }

    const t = Date.parse(s);
    if (!Number.isFinite(t)) return null;
    const d = new Date(t);
    return isValidDate(d) ? d : null;
  }

  return null;
}

/** 로컬 기준 YYYY-MM-DD */
export function formatYmd(input: DateInput): string {
  const d = toDateMaybe(input);
  if (!d) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 로컬 기준 YYYY-MM-DDTHH:mm */
export function formatYmdHm(input: DateInput): string {
  const d = toDateMaybe(input);
  if (!d) return "";

  const ymd = formatYmd(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${ymd}T${hh}:${mi}`;
}

/** YYYY-MM-DD 문자열을 로컬 midnight Date로 파싱 */
export function parseYmdLocal(ymd?: string): Date | null {
  if (!ymd) return null;
  const s = String(ymd).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map((x) => Number(x));
  const dt = new Date(y, m - 1, d);
  return isValidDate(dt) ? dt : null;
}

export function startOfDay(input: DateInput): Date | null {
  const d = toDateMaybe(input);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const KOR_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatShortDate(
  input: DateInput,
  opts?: { weekday?: boolean; time?: boolean }
): string {
  const d = toDateMaybe(input);
  if (!d) return "";

  const base = opts?.time ? formatYmdHm(d).replace("T", " ") : formatYmd(d);
  if (!opts?.weekday) return base;

  const wd = KOR_WEEKDAY[d.getDay()];
  return `${base}(${wd})`;
}

/**
 * 날짜 범위 포맷
 * - end가 없거나 start와 동일하면 start만 표시
 * - 기본은 YYYY-MM-DD(요일) 형태
 */
export function formatRange(
  start: DateInput,
  end?: DateInput,
  opts?: { weekday?: boolean; time?: boolean }
): string {
  const s = toDateMaybe(start);
  const e = toDateMaybe(end);

  if (!s && !e) return "";
  if (s && !e) return formatShortDate(s, { weekday: true, ...opts });
  if (!s && e) return formatShortDate(e, { weekday: true, ...opts });

  // 둘 다 있는 경우
  const sYmd = formatYmd(s!);
  const eYmd = formatYmd(e!);
  if (sYmd && eYmd && sYmd === eYmd) {
    return formatShortDate(s!, { weekday: true, ...opts });
  }

  return `${formatShortDate(s!, { weekday: true, ...opts })} ~ ${formatShortDate(e!, {
    weekday: true,
    ...opts,
  })}`;
}
