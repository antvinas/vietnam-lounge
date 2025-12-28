import { useEffect, useState } from "react";
import { getCrossRate } from "../../lib/exchange"; // 상대경로 정정

type Code = "VND" | "KRW" | "USD" | "EUR";

export default function ExchangeRateWidget({
  base = "VND",
  quote = "KRW",
  compact,
}: { base?: Code; quote?: Code; compact?: boolean }) {
  const [rate, setRate] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const r = await getCrossRate(base, quote);
        if (!off) setRate(r);
      } catch {
        if (!off) setErr("환율 불러오기 실패");
      }
    })();
    return () => { off = true; };
  }, [base, quote]);

  if (err) return <div className="text-sm text-rose-400">{err}</div>;
  if (rate == null) return <div className="text-sm text-slate-400">불러오는 중…</div>;

  return (
    <div className="text-slate-200">
      <div className="text-xs text-slate-400 mb-1">환율</div>
      <div className="text-lg font-semibold">
        1 {base} ≈ {rate.toFixed(4)} {quote}
      </div>
      {!compact && <p className="mt-1 text-xs text-slate-400">ECB 교차환율 기준</p>}
    </div>
  );
}
