export default function OpenNowWidget() {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
      <div className="text-sm text-slate-500">지금 영업중</div>
      <ul className="mt-2 text-sm space-y-1">
        <li>🟢 카페 루프탑 (라스트오더 21:30)</li>
        <li>🟣 바 네온 (해피아워 ~20:00)</li>
        <li>🟢 분짜 맛집 (브레이크 15–17h)</li>
      </ul>
    </div>
  );
}
