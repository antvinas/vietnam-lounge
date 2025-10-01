import { useMemo, useState } from 'react';

export default function BudgetWidget() {
  const [currency, setCurrency] = useState<'VND'|'KRW'>('VND');
  const rate = 0.032; // 1,000 VND ≈ 32 KRW (예시)
  const totalVND = 450_000; // 더미 합계
  const display = useMemo(()=>{
    return currency==='VND' ? `${totalVND.toLocaleString()} VND`
      : `${Math.round(totalVND*rate).toLocaleString()} KRW`;
  },[currency,totalVND]);

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">예산</h4>
        <div className="flex gap-1">
          <button onClick={()=>setCurrency('VND')} className={`px-2 py-1 text-xs rounded ${currency==='VND'?'bg-slate-900 text-white':'border'}`}>VND</button>
          <button onClick={()=>setCurrency('KRW')} className={`px-2 py-1 text-xs rounded ${currency==='KRW'?'bg-slate-900 text-white':'border'}`}>KRW</button>
        </div>
      </div>
      <div className="text-2xl mt-2">{display}</div>
      <div className="text-xs text-slate-500 mt-1">식사/교통/입장료/주류 카테고리 합계</div>
    </div>
  );
}
