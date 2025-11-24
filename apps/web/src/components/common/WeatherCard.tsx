import { useEffect, useMemo, useState } from 'react';

type Props = {
  lat?: number;
  lng?: number;
  title?: string;
};

type Daily = { date: string; tmin: number; tmax: number; code: number };

export default function WeatherCard({ lat = 21.0278, lng = 105.8342, title = '날씨' }: Props) {
  const [days, setDays] = useState<Daily[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const url = useMemo(
    () =>
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(
        tz
      )}`,
    [lat, lng, tz]
  );

  useEffect(() => {
    let aborted = false;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (aborted) return;
        const out: Daily[] = (j.daily?.time || []).map((d: string, i: number) => ({
          date: d,
          tmin: j.daily?.temperature_2m_min?.[i],
          tmax: j.daily?.temperature_2m_max?.[i],
          code: j.daily?.weathercode?.[i],
        }));
        setDays(out.slice(0, 3));
      })
      .catch((e) => setErr(e?.message || 'error'));
    return () => {
      aborted = true;
    };
  }, [url]);

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
      <h3 className="font-semibold">{title}</h3>
      {err && <p className="text-sm text-rose-500 mt-1">불러오기 실패</p>}
      {!days && !err && <p className="text-sm text-slate-500 mt-1">로딩 중…</p>}
      {days && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {days.map((d) => (
            <div key={d.date} className="rounded-lg border p-3">
              <div className="text-xs text-slate-500">{d.date}</div>
              <div className="text-lg font-semibold">{Math.round(d.tmax)}°</div>
              <div className="text-xs text-slate-500">최저 {Math.round(d.tmin)}°</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
