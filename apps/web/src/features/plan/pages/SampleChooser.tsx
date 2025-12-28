// apps/web/src/features/plan/pages/SampleChooser.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFocusTrap } from "@/utils/a11y/useFocusTrap";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import { usePlanStore } from "@/store/plan.store";
import { t } from "@/features/plan/locales/strings";

const options = [
  { id: "hanoi", title: "하노이" },
  { id: "danang", title: "다낭" },
  { id: "hcmc", title: "호치민" },
  { id: "phuquoc", title: "푸꾸옥" },
];

export default function SampleChooser() {
  const navigate = useNavigate();
  const locale = usePlanUIStore((s) => s.locale);

  const importSampleTrip = usePlanStore((s) => (s as any).importSampleTrip);
  const setLastSampleTripId = usePlanUIStore((s) => s.setLastSampleTripId);

  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(containerRef);

  const handleClose = useCallback(() => {
    navigate("/plan", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const handleChoose = useCallback(
    async (cityId: string) => {
      if (!importSampleTrip) {
        handleClose();
        return;
      }
      if (isSubmitting) return;

      setIsSubmitting(cityId);
      try {
        const id = await importSampleTrip({
          templateId: cityId as any,
          isSample: true,
        });
        if (id) setLastSampleTripId(id);
      } catch (err) {
        console.error("Failed to import sample:", err);
      } finally {
        setIsSubmitting(null);
        handleClose();
      }
    },
    [handleClose, importSampleTrip, isSubmitting, setLastSampleTripId]
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
              className="flex items-center justify-between rounded-xl border p-4 text-left hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <span className="font-semibold">{opt.title}</span>
              <span className="text-sm text-gray-500">
                {isSubmitting === opt.id ? "생성중..." : "선택"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
