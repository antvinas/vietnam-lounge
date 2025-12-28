import { Link } from "react-router-dom";

export default function PlanHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-12">
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          여정의 흐름을 설계하세요
        </h1>
        <p className="mt-3 text-slate-300">
          시간·예산·이동을 한 화면에서 정리합니다. 시작 방식을 선택하세요.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          title="직접 일정 만들기"
          desc="드래그 앤 드롭으로 순서 정리"
          to="/plan/editor?preset=blank"
          cta="편집기로 이동"
        />
        <Card
          title="추천 코스/상품"
          desc="지역별 인기 루트와 액티비티"
          to="/plan/editor?preset=recommended"
          cta="추천으로 시작"
        />
        <Card
          title="공유·불러오기"
          desc="링크·ICS·PDF 내보내기/가져오기"
          to="/plan/editor?preset=import"
          cta="불러오기"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
        <Badge>환율/날씨 위젯</Badge>
        <Badge>교통 모드 토글</Badge>
        <Badge>경로 최적화</Badge>
        <Badge>예산·정산</Badge>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_60%_at_70%_20%,black,transparent)]">
        <div className="absolute right-[-20%] top-[-20%] h-[50rem] w-[50rem] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
    </section>
  );
}

function Card({
  title,
  desc,
  to,
  cta,
}: {
  title: string;
  desc: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-800/60 p-5 hover:bg-slate-800/80">
      <div>
        <h3 className="text-white font-medium">{title}</h3>
        <p className="mt-1 text-sm text-slate-300">{desc}</p>
      </div>
      <Link
        to={to}
        className="mt-4 inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-300 hover:bg-emerald-500/20"
      >
        {cta}
      </Link>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
      {children}
    </span>
  );
}
