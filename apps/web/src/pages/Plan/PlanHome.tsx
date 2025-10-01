import { Link } from "react-router-dom";

const PlanHome = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">여행 플래너</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-8">
        베트남 여행 일정을 직접 만들고, 편집하고, 공유할 수 있습니다.
      </p>

      <div className="flex justify-center gap-4">
        {/* 새 플랜 만들기 → Planner 페이지 */}
        <Link
          to="/plan/planner"
          className="px-6 py-3 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition"
        >
          새 플랜 만들기
        </Link>

        {/* 플랜 편집기 → PlanEditor 페이지 */}
        <Link
          to="/plan/editor"
          className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          플랜 편집기 열기
        </Link>
      </div>

      <div className="mt-12 text-sm text-slate-500 dark:text-slate-400">
        * 공유된 일정은 <code>/plan/:id/share</code> 경로에서 확인할 수 있습니다.
      </div>
    </main>
  );
};

export default PlanHome;