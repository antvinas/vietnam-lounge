// components/plan/PlanEmptyState.tsx

import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePlanUIStore } from "@/store/plan.ui.store";
import { t } from "@/components/plan/strings";

const LOCALE: "ko" = "ko";

type Props = {
  /** 새 일정 만들기 (없으면 기본: 위저드 열기) */
  onCreateNew?: () => void;
  /** 샘플 일정 먼저 구경하기 */
  onOpenSample?: () => void;
  /** 기존 일정 열기 (최근 플랜 등) */
  onOpenExisting?: () => void;
};

export default function PlanEmptyState({
  onCreateNew,
  onOpenSample,
  onOpenExisting,
}: Props) {
  const openWizard = usePlanUIStore((s) => s.openWizard);
  const navigate = useNavigate();
  const location = useLocation();

  const actions = useMemo(
    () => ({
      create: onCreateNew ?? openWizard,
      sample:
        onOpenSample ??
        (() => {
          // ✅ background location을 state에 함께 넘겨 모달 라우팅 패턴 유지
          navigate("/plan/sample", {
            state: { backgroundLocation: location, background: location },
            replace: false,
          });
        }),
      recent:
        onOpenExisting ??
        (() => {
          alert("이전 일정을 여는 기능을 아직 연결하지 않았어요.");
        }),
    }),
    [onCreateNew, onOpenSample, onOpenExisting, openWizard, navigate, location]
  );

  return (
    <section
      className="mx-auto my-24 max-w-2xl rounded-2xl border border-border bg-surface p-10 text-center shadow-card"
      aria-labelledby="plan-empty-title"
    >
      <h1
        id="plan-empty-title"
        className="mb-3 text-2xl font-bold tracking-tight text-text-main"
      >
        {t(LOCALE, "empty", "title")}
      </h1>

      <p className="mb-6 text-sm text-text-secondary">
        {t(LOCALE, "empty", "subtitle")}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={actions.create}
          className="btn btn-primary"
          aria-label={t(LOCALE, "empty", "ctaNew")}
        >
          {t(LOCALE, "empty", "ctaNew")}
        </button>

        <button
          type="button"
          onClick={actions.sample}
          className="btn btn-outline"
          aria-label={t(LOCALE, "empty", "ctaSample")}
        >
          {t(LOCALE, "empty", "ctaSample")}
        </button>

        <button
          type="button"
          onClick={actions.recent}
          className="btn btn-link"
          aria-label={t(LOCALE, "empty", "ctaOpenExisting")}
        >
          {t(LOCALE, "empty", "ctaOpenExisting")}
        </button>
      </div>

      <p className="mt-6 text-xs text-text-tertiary">
        {t(LOCALE, "empty", "hint")}
      </p>
    </section>
  );
}
