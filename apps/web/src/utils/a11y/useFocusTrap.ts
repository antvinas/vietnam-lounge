// apps/web/src/utils/a11y/useFocusTrap.ts
import { RefObject, useEffect, useRef } from "react";

type FocusTrapOptions = {
  /** 포커스를 가둬 둘 컨테이너 */
  containerRef: RefObject<HTMLElement | null> | null | undefined;
  /** true 일 때만 트랩 활성화 */
  active?: boolean;
  /** 언마운트 시 이전 포커스로 돌아갈지 여부 (기본 true) */
  restoreFocus?: boolean;
};

/**
 * useFocusTrap
 *
 * 사용방법 (둘 다 지원):
 *  - useFocusTrap(panelRef, true)
 *  - useFocusTrap({ containerRef: panelRef, active: true, restoreFocus: true })
 */
export function useFocusTrap(
  refOrOptions:
    | RefObject<HTMLElement | null>
    | null
    | undefined
    | FocusTrapOptions,
  maybeActive: boolean = true
): void {
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // 인자 정규화: ref + boolean / options 객체 두 가지 패턴 모두 지원
  const { containerRef, active, restoreFocus } = normalizeArgs(
    refOrOptions,
    maybeActive
  );

  useEffect(() => {
    // 비활성 시 아무 것도 하지 않음
    if (!active) return;

    const ref = containerRef;
    if (!ref || !("current" in ref)) return;

    const root = ref.current as HTMLElement | null;
    if (!root) return;

    // 이전 포커스 기억
    lastActiveElementRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    // 첫 포커스 대상 찾기
    const focusable = root.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(",")
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) {
      first.focus();
    } else {
      // 포커스 가능한 요소가 하나도 없으면 컨테이너 자체에 포커스
      if (!root.hasAttribute("tabindex")) {
        root.tabIndex = -1;
      }
      root.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (!focusable.length) {
        e.preventDefault();
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        // Shift + Tab : 첫 번째에서 다시 마지막으로
        if (!activeEl || activeEl === first || !root.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab : 마지막에서 다시 첫 번째로
        if (!activeEl || activeEl === last || !root.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    root.addEventListener("keydown", handleKeyDown);

    return () => {
      root.removeEventListener("keydown", handleKeyDown);

      if (restoreFocus && lastActiveElementRef.current) {
        // 패널 닫힌 뒤 이전 포커스로 복원
        try {
          lastActiveElementRef.current.focus();
        } catch {
          // 포커스할 수 없는 경우는 조용히 무시
        }
      }
    };
  }, [containerRef, active, restoreFocus]);
}

function normalizeArgs(
  refOrOptions:
    | RefObject<HTMLElement | null>
    | null
    | undefined
    | FocusTrapOptions,
  maybeActive: boolean
): Required<FocusTrapOptions> {
  // 아무 인자도 없으면 비활성
  if (!refOrOptions) {
    return {
      containerRef: null,
      active: false,
      restoreFocus: true,
    };
  }

  // ref + boolean 형태: useFocusTrap(ref, active)
  if ("current" in (refOrOptions as any)) {
    return {
      containerRef: refOrOptions as RefObject<HTMLElement | null>,
      active: maybeActive,
      restoreFocus: true,
    };
  }

  // 옵션 객체 형태: useFocusTrap({ containerRef, active, restoreFocus })
  const opts = refOrOptions as FocusTrapOptions;
  return {
    containerRef: opts.containerRef ?? null,
    active: opts.active ?? maybeActive,
    restoreFocus: opts.restoreFocus ?? true,
  };
}
