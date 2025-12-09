import { ReactNode, useEffect, useRef } from "react";
import { useScrollLock } from "@/utils/a11y/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 폼 모달 기본: false. true면 오버레이 클릭으로 닫힘 */
  overlayClosable?: boolean;
  /** ESC로 닫기 허용 여부. 기본 true */
  escClosable?: boolean;
}

/**
 * Accessible Modal
 * - role="dialog" aria-modal="true" aria-labelledby
 * - ESC 닫기(옵션), 초기 포커스, 포커스 트랩, 포커스 복귀
 * - 폼 포함 모달의 기본 정책: 오버레이 클릭으로 닫지 않음
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  overlayClosable = false,
  escClosable = true,
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = "modal-title";

  // 배경 스크롤 잠금
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;

    // 초기 포커스
    (closeBtnRef.current ?? dialogRef.current)?.focus();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && escClosable) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        // 포커스 트랩
        const container = dialogRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement as HTMLElement | null;

        if (!e.shiftKey && current === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && current === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeydown, true);
    return () => {
      document.removeEventListener("keydown", handleKeydown, true);
      // 포커스 복귀
      prevActive?.focus?.();
    };
  }, [isOpen, onClose, escClosable]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={overlayClosable ? onClose : undefined}
        aria-label="모달 오버레이"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative m-4 w-full max-w-md rounded-xl border border-border bg-surface dark:bg-surface/90 shadow-card dark:shadow-depth outline-none"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-border p-4 dark:border-border/50">
          <h3 id={titleId} className="text-lg font-bold text-text-main">
            {title}
          </h3>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="rounded p-1 text-text-secondary hover:bg-black/5 hover:text-text-main dark:hover:bg-white/10"
            aria-label="모달 닫기"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 text-text-secondary">{children}</div>

        {footer && <div className="flex justify-end border-t border-border p-4 dark:border-border/50">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
