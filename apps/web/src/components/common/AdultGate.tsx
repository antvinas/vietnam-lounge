// src/components/common/AdultGate.tsx
import { useCallback, useEffect, useRef, useState } from "react";

interface AdultGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * 접근성 보강된 성인 게이트
 * - role="dialog" + aria-modal
 * - 초기 포커스 이동
 * - ESC 닫기
 * - 포커스 트랩(Tab/Shift+Tab 순환)
 */
const AdultGate = ({ onSuccess, onCancel }: AdultGateProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // 초기 포커스 및 복귀
  useEffect(() => {
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    // 첫 포커스 대상
    const target =
      primaryButtonRef.current ??
      (dialogRef.current?.querySelector(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      ) as HTMLElement | null);
    target?.focus();

    // 스크롤 잠금
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
      lastActiveRef.current?.focus?.();
    };
  }, []);

  // ESC 닫기
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
        return;
      }
      if (e.key === "Tab") {
        // 포커스 트랩
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    },
    [onCancel]
  );

  const handleEnter = () => {
    if (dontShowAgain) localStorage.setItem("adult_gate_preference", "hide");
    onSuccess();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      // 바깥 클릭으로 닫기 원하면 onClick={onCancel} 사용, 내부는 이벤트 버블링 차단
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adult-gate-title"
        aria-describedby="adult-gate-desc"
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl outline-none"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="adult-gate-title"
          className="mb-2 text-center text-2xl font-bold text-text-main"
        >
          Nightlife Zone
        </h2>
        <p
          id="adult-gate-desc"
          className="mb-6 text-center text-sm text-text-secondary"
        >
          성인 이용자만 접근할 수 있는 영역입니다. 계속하시겠습니까?
        </p>

        <label className="mb-5 flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4"
          />
          다음부터 이 안내 보지 않기
        </label>

        <div className="flex items-center justify-center gap-3">
          <button
            ref={primaryButtonRef}
            onClick={handleEnter}
            className="rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white transition-transform duration-240 hover:scale-[1.02]"
          >
            입장하기
          </button>
          <button
            onClick={onCancel}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-main hover:bg-background-sub"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdultGate;
