// apps/web/src/features/plan/pages/SampleChooser.tsx

import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import { useFocusTrap } from "@/utils/a11y/useFocusTrap";
import { t, getDefaultLocale } from "@/features/plan/locales/strings";

// [UI 개선] 4대 주요 도시 3박4일 코스로 통일
const options = [
  { id: "hanoi", title: "하노이", sub: "Old Quarter · 하롱베이 투어" },
  { id: "danang", title: "다낭", sub: "미케비치 · 바나힐 · 호이안" },
  { id: "nhatrang", title: "나트랑", sub: "빈원더스 · 머드온천 · 시티" },
  { id: "phuquoc", title: "푸꾸옥", sub: "남부/북부 완전 정복" },
];

export default function SampleChooser() {
  const locale = getDefaultLocale();
  const navigate = useNavigate();
  const importSampleTrip = usePlanStore((s) => s.importSampleTrip);
  const setLastSampleTripId = usePlanUIStore((s) => s.setLastSampleTripId);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    navigate("/plan", { replace: true });
  }, [navigate]);

  useFocusTrap({
    containerRef,
    onEscape: handleClose,
    returnFocus: true,
  });

  const handleChoose = useCallback(
    async (cityId: string) => {
      if (isSubmitting) return;
      setIsSubmitting(cityId);

      try {
        // [수정] cityId ("hanoi" 등)를 보내면 store 내부나 index.ts에서 "hanoi-3n4d"로 자동 매핑됨
        const id = await importSampleTrip({
          templateId: cityId as any,
          isSample: true,
        });
        setLastSampleTripId(id);
      } catch (err) {
        console.error("Failed to import sample:", err);
      } finally {
        setIsSubmitting(null);
        handleClose();
      }
    },
    [handleClose, importSampleTrip, isSubmitting, setLastSampleTripId],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t(locale, "sample", "title")}
          </h2>
          <button
            type="button"
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleClose}
          >
            {t(locale, "sample", "close")}
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          여행하고 싶은 도시를 선택하세요. 3박 4일 추천 코스가 자동으로 생성됩니다.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleChoose(opt.id)}
              disabled={!!isSubmitting}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {opt.title}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {opt.sub}
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {isSubmitting === opt.id ? "생성 중..." : "선택"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}