// apps/web/src/features/plan/components/Wizard/index.tsx

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePlanWizard } from "@/features/plan/hooks/usePlanWizard";
import StepTrip from "./StepTrip";
import StepBudget from "./StepBudget";
import StepBase from "./StepBase";
import StepTransport from "./StepTransport";
import StepSeedSpots from "./StepSeedSpots";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import { useFocusTrap } from "@/utils/a11y/useFocusTrap";
import { useScrollLock } from "@/utils/a11y/useScrollLock";
import Stepper from "@/features/plan/components/Wizard/Stepper";

export default function PlanWizard() {
  const { step, canPrev, canNext, prev, next, complete, bind, saveDraft } =
    usePlanWizard();

  const close = usePlanUIStore((s) => s.closeWizard);

  useScrollLock(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);

  const requestClose = useCallback(() => {
    const ok = window.confirm("작성 내용이 사라집니다. 닫을까요?");
    if (ok) close();
  }, [close]);

  // ✅ 훅 시그니처에 맞게: RefObject만 전달
  useFocusTrap(containerRef);

  useEffect(() => {
    initialFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestClose]);

  const tripBinding = bind("trip") as any;
  const vTrip = tripBinding.value;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      aria-describedby="wizard-desc"
      className="fixed inset-0 z-50"
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div
        ref={containerRef}
        className="
          absolute inset-0
          lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
          w-full h-full lg:w-[90vw] lg:h-[80vh]
          grid grid-rows-[auto_1fr_auto]
          rounded-none lg:rounded-xl bg-white dark:bg-gray-900
          shadow-none lg:shadow-xl ring-0 lg:ring-1 lg:ring-black/10
          outline-none
        "
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 id="wizard-title" className="text-base font-semibold">
                여행 계획 만들기
              </h2>
              <p id="wizard-desc" className="sr-only">
                Tab으로 이동, Shift+Tab으로 반대로 이동. ESC로 닫기.
              </p>
            </div>
            <Stepper
              steps={["기본정보", "예산", "거점", "이동수단", "초기 스팟"]}
              current={typeof step === "number" ? step : 0}
            />
          </div>

          <button
            ref={initialFocusRef}
            onClick={requestClose}
            className="rounded-md border px-2 py-1 text-sm"
            aria-label="마법사 닫기"
            type="button"
          >
            취소
          </button>
        </header>

        <section className="p-4 overflow-y-auto">
          {step === 0 && <StepTrip {...(bind("trip") as any)} />}
          {step === 1 && <StepBudget {...(bind("budget") as any)} trip={vTrip} />}
          {step === 2 && <StepBase {...(bind("base") as any)} />}
          {step === 3 && <StepTransport {...(bind("transport") as any)} />}
          {step === 4 && <StepSeedSpots {...(bind("seed") as any)} />}
        </section>

        <footer className="sticky bottom-0 flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
          <button
            type="button"
            onClick={prev}
            disabled={!canPrev}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          >
            이전
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (typeof saveDraft === "function") {
                  await saveDraft();
                  alert("임시 저장했어요.");
                }
              }}
              className="rounded-md border px-3 py-2 text-sm"
            >
              임시저장
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canNext}
                className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={complete}
                className="rounded-md bg-black px-3 py-2 text-sm text-white"
              >
                완료
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
