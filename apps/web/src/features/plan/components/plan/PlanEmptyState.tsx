// apps/web/src/features/plan/components/plan/PlanEmptyState.tsx

import React from "react";
import { Compass, MapPin, ArrowRight } from "lucide-react";
import { t, Locale } from "@/features/plan/locales/strings";

type Props = {
  locale?: Locale;
  hasExistingTrip: boolean;
  onCreateNew: () => void;
  onOpenSample: () => void;
  onOpenSampleTrip?: () => void; // 호환성
  onImportSample: (templateId: string) => void;
  onOpenExisting?: () => void;
};

// [수정] 이미지 URL 교체 (안정적인 고화질 소스)
const FEATURED_SAMPLES = [
  {
    id: "danang-3n4d",
    city: "다낭",
    title: "3박 4일 힐링 & 유흥 완전정복",
    desc: "미케비치, 바나힐, 그리고 뜨거운 밤문화까지.",
    // 기존 다낭 이미지 (유지)
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "nhatrang-3n4d",
    city: "나트랑",
    title: "빈원더스 & 머드온천 액티비티",
    desc: "낮에는 신나는 테마파크, 밤에는 루프탑 바.",
    // [변경] 나트랑 해변 느낌
    img: "https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "phuquoc-3n4d",
    city: "푸꾸옥",
    title: "남부/북부 핵심 스팟 총정리",
    desc: "사파리부터 케이블카까지, 휴양의 끝판왕.",
    // [변경] 푸꾸옥 리조트 느낌
    img: "https://images.unsplash.com/photo-1590609749472-4045414912a2?auto=format&fit=crop&w=600&q=80",
  },
];

export function PlanEmptyState({
  locale = "ko",
  hasExistingTrip,
  onCreateNew,
  onOpenSample,
  onOpenSampleTrip,
  onImportSample,
  onOpenExisting,
}: Props) {
  const handleOpenSample = onOpenSample || onOpenSampleTrip;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-900 text-white shadow-2xl">
      
      {/* 1. 배경 이미지 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Day Mode */}
        <img
          src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
          alt="Vietnam Day"
          className="h-full w-full object-cover opacity-100 transition-opacity duration-700 dark:opacity-0"
        />
        {/* Night Mode */}
        <img
          src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
          alt="Vietnam Night"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 dark:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
      </div>

      {/* 2. 메인 콘텐츠 */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md">
          <Compass className="mr-1.5 h-3.5 w-3.5" />
          베트남 여행 플래너
        </div>

        <h1 className="mb-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl drop-shadow-lg">
          당신의 완벽한 베트남 여행,<br />
          <span className="text-emerald-400">지금 시작해볼까요?</span>
        </h1>
        
        <p className="mb-10 max-w-lg text-base text-slate-200 sm:text-lg drop-shadow-md">
          {t(locale, "empty", "subtitle")}
        </p>

        {/* [수정] 버튼 그룹: whitespace-nowrap 추가 및 너비 조정 */}
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <button
            onClick={handleOpenSample}
            className="flex flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-95"
          >
            추천 코스로 시작하기
          </button>
          
          {hasExistingTrip && (
            <button
              onClick={onOpenExisting}
              className="flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-95"
            >
              이전 일정 열기
            </button>
          )}
        </div>

        {!hasExistingTrip && (
          <button
            onClick={onCreateNew}
            className="mt-6 text-sm font-medium text-slate-300 underline decoration-slate-500 underline-offset-4 hover:text-white"
          >
            빈 화면에서 직접 만들래요
          </button>
        )}
      </div>

      {/* 3. 하단 추천 일정 카드 */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">🔥 지금 뜨는 추천 코스</h3>
            <button 
              onClick={handleOpenSample}
              className="flex items-center text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              전체 보기 <ArrowRight className="ml-1 h-3 w-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {FEATURED_SAMPLES.map((item) => (
              <button
                key={item.id}
                onClick={() => onImportSample(item.id)}
                className="group relative flex h-24 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-800 text-left transition hover:border-emerald-500/50 hover:shadow-xl sm:h-32"
              >
                <div className="w-24 shrink-0 sm:w-32">
                  <img 
                    src={item.img} 
                    alt={item.city} 
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // 이미지 로드 실패 시 대체 이미지 (Fallback)
                      e.currentTarget.src = "https://via.placeholder.com/150?text=Vietnam";
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center px-4">
                  <div className="mb-1 flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    <MapPin className="mr-1 h-3 w-3" /> {item.city}
                  </div>
                  <div className="mb-1 text-sm font-bold text-white line-clamp-1">{item.title}</div>
                  <div className="text-xs text-slate-400 line-clamp-1 sm:line-clamp-2">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}