export default function WeatherWidget() {
  // 더미: 우천 확률 60%면 '실내 대체' 제안
  const rain = 30 + Math.round(Math.random()*50);
  const suggest = rain >= 50;
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
      <div className="text-sm text-slate-500 dark:text-slate-300">오늘 강수 확률</div>
      <div className="text-2xl font-semibold mt-1">{rain}%</div>
      {suggest && (
        <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          비 예보가 있어요. 실내 코스로 바꿔볼까요?
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm">대체안 보기</button>
        <button className="px-3 py-1.5 rounded-md border text-sm">우천 무시</button>
      </div>
    </div>
  );
}
