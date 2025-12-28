import { useEffect, useState } from "react";

export default function WeatherWidget({
  lat, lng, mode = "compact",
}: { lat?: number; lng?: number; mode?: "compact" | "full" }) {
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    if (lat == null || lng == null) return;
    (async () => {
      try {
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
        const j = await (await fetch(u)).json();
        if (!off) {
          setTemp(j?.current?.temperature_2m ?? null);
          setCode(j?.current?.weather_code ?? null);
        }
      } catch {
        if (!off) setErr("날씨 불러오기 실패");
      }
    })();
    return () => { off = true; };
  }, [lat, lng]);

  if (lat == null || lng == null) return <div className="text-sm text-slate-400">위치 필요</div>;
  if (err) return <div className="text-sm text-rose-400">{err}</div>;
  if (temp == null) return <div className="text-sm text-slate-400">불러오는 중…</div>;

  return (
    <div className="text-slate-200">
      <div className="text-xs text-slate-400 mb-1">현재 날씨</div>
      <div className="text-lg font-semibold">{Math.round(temp)}°C <span className="text-sm">{label(code)}</span></div>
      {mode === "full" && <p className="mt-1 text-xs text-slate-400">Open-Meteo</p>}
    </div>
  );
}

function label(code: number | null) {
  if (code == null) return "";
  if (code === 0) return "맑음";
  if ([1,2,3].includes(code)) return "구름";
  if ([45,48].includes(code)) return "안개";
  if ([51,53,55,61,63,65].includes(code)) return "비";
  if ([71,73,75].includes(code)) return "눈";
  if ([95,96,99].includes(code)) return "뇌우";
  return "날씨";
}
