// pages/Plan/SampleChooser.tsx

import React, { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlanStore } from "@/store/plan.store";
import { usePlanUIStore } from "@/store/plan.ui.store";
import { useFocusTrap } from "@/utils/a11y/useFocusTrap";
import { t, getDefaultLocale } from "@/components/plan/strings";

// ✅ 템플릿 레지스트리가 이해할 수 있는 ID 형식으로 변경
// "@/data/plan.templates" 쪽 규칙:
// - CityId: "hanoi" | "hcm" | "nhatrang" | "phuquoc" | "danang"
// - TemplateId: CityId | `${CityId}-${VariantId}`
//   ex) "hanoi"        -> DEFAULT_BY_CITY 에서 "hanoi-2n3d" 로 매핑
//   ex) "phuquoc-2n3d" -> 그대로 STATIC_REGISTRY 에서 사용
const options = [
  { id: "hanoi", title: "하노이", sub: "Old Quarter · 호안끼엠" },
  { id: "hcm", title: "호치민", sub: "District 1 · 3" },
  { id: "nhatrang", title: "나트랑", sub: "해변/섬 투어" },
  { id: "phuquoc-2n3d", title: "푸꾸옥", sub: "남/북섬 하이라이트" },
];

export default function SampleChooser() {
  const locale = getDefaultLocale();

  const navigate = useNavigate();
  const location = useLocation();

  const importSampleTrip = usePlanStore((s) => s.importSampleTrip);
  const setLastSampleTripId = usePlanUIStore((s) => s.setLastSampleTripId);

  const containerRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap({
    containerRef,
    onEscape: () => handleClose(),
    returnFocus: true,
  });

  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    const bg: any =
      (location.state as any)?.background ||
      (location.state as any)?.backgroundLocation ||
      "/plan";
    navigate(bg, { replace: true });
  }, [location.state, navigate]);

  const handleChoose = useCallback(
    async (templateId: string) => {
      if (isSubmitting) return;
      setIsSubmitting(templateId);
      try {
        // ✅ 여기로 들어오는 templateId 가 위 options 의 id 그대로 들어감
        //    이제는 getTemplate() 이 이해할 수 있는 값이라 에러 없이 샘플 생성됨.
        const id = await importSampleTrip(templateId as any, {
          isSample: true,
        });
        setLastSampleTripId(id);
      } finally {
        setIsSubmitting(null);
        handleClose(); // 배경으로 닫기 (폴백 포함)
      }
    },
    [handleClose, importSampleTrip, isSubmitting, setLastSampleTripId]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={containerRef}
        className="absolute left-1/2 top-24 w-[680px] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 dark:bg-gray-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold">
            {t(locale, "sample", "title")}
          </div>
          <button
            type="button"
            className="rounded-md border px-2 py-1 text-sm dark:border-gray-700"
            onClick={handleClose}
          >
            {t(locale, "sample", "close")}
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          {t(locale, "sample", "desc")}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleChoose(opt.id)}
              disabled={!!isSubmitting}
              aria-busy={isSubmitting === opt.id}
              className="flex items-center justify-between rounded-xl border p-4 text-left hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div>
                <div className="text-base font-medium">{opt.title}</div>
                <div className="text-sm text-gray-500">{opt.sub}</div>
              </div>
              <span className="text-sm text-emerald-600">
                {isSubmitting === opt.id
                  ? t(locale, "sample", "opening")
                  : t(locale, "sample", "openNow")}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          {t(locale, "sample", "previewNote")}
        </div>
      </div>
    </div>
  );
}
