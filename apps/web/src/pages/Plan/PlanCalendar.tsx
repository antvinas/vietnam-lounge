import { usePlanStore } from '@/store/usePlanStore';

export default function PlanCalendar() {
  const { currentDate, setDate } = usePlanStore();
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-6">
      <div className="text-sm text-slate-500 mb-2">여행 날짜</div>
      <input
        type="date"
        value={currentDate}
        onChange={(e)=>setDate(e.target.value)}
        className="px-3 py-2 rounded border bg-white dark:bg-slate-900"
      />
      <div className="text-sm text-slate-500 mt-2">* 월/주/일 캘린더는 이후 확장</div>
    </div>
  );
}
