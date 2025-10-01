import Timeline from '@/components/plan/Timeline';
import WeatherWidget from '@/components/plan/WeatherWidget';
import BudgetWidget from '@/components/plan/BudgetWidget';
import OpenNowWidget from '@/components/plan/OpenNowWidget';
import PlanCalendar from './PlanCalendar';
import ShareBar from '@/components/plan/ShareBar';
import { usePlanStore } from '@/store/usePlanStore';

export default function PlanEditor() {
  const { nightMode, setNightMode } = usePlanStore();
  return (
    <main className={`min-h-[calc(100vh-120px)] ${nightMode ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">여행 플래너</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-300">Explorer</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={nightMode} onChange={(e)=>setNightMode(e.target.checked)} />
              <div className="w-12 h-6 bg-slate-300 peer-checked:bg-violet-500 rounded-full relative transition">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:left-6 transition shadow" />
              </div>
            </label>
            <span className="text-sm text-slate-500 dark:text-violet-300">Nightlife</span>
          </div>
        </div>

        {/* Split 레이아웃 */}
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-7">
            <Timeline />
          </section>

          <aside className="col-span-12 lg:col-span-5 space-y-4">
            <div className="rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 h-52 flex items-center justify-center text-slate-500">
              지도(placeholder) – 마커/폴리라인은 이후 Map SDK로 교체
            </div>
            <PlanCalendar />
            <WeatherWidget />
            <OpenNowWidget />
            <BudgetWidget />
          </aside>
        </div>
      </div>

      <ShareBar />
    </main>
  );
}
