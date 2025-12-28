export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function formatISO(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 금/토 출발을 선호. 오늘이 목 이후면 다음 주말 */
export function nextWeekend(from = new Date()) {
  const dow = from.getDay(); // 0=일
  const toFri = (5 - dow + 7) % 7; // 금요일까지
  const base = addDays(from, toFri || 7); // 최소 일주일 여유
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}
