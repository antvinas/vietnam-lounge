import * as React from "react";

type ResizeHandleProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (next: number) => void;
  ariaLabel?: string;
  ariaControlsLeftId?: string;
  ariaControlsRightId?: string;
  /** 외부에서 설명요소 id를 주입하고 싶다면 지정 (미지정 시 내부에서 생성) */
  ariaDescribedById?: string;
  className?: string;
};

/**
 * 수평 2-Pane 사이의 리사이저 (세로 분리자).
 * - 마우스/터치 드래그 + 키보드(←/→, Home/End, Shift+←/→) 지원
 * - ARIA role="separator" + aria-orientation="vertical"
 * - aria-describedby로 현재 폭 안내를 추가 (선택)
 */
export default function ResizeHandle({
  value,
  min = 280,
  max = 720,
  step = 8,
  onChange,
  ariaLabel = "사이드바 크기 조절",
  ariaControlsLeftId,
  ariaControlsRightId,
  ariaDescribedById,
  className = "",
}: ResizeHandleProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const startX = React.useRef(0);
  const startVal = React.useRef(value);
  const dragging = React.useRef(false);
  const internalDescId = React.useId();
  const descId = ariaDescribedById ?? internalDescId;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const stopDragging = React.useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      ref.current?.releasePointerCapture?.((ref.current as any).__activePointerId);
    } catch {}
    document.body.classList.remove("resize-cursor-col");
  }, []);

  React.useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (!dragging.current) return;
      const dx = ev.clientX - startX.current;
      onChange(clamp(startVal.current + dx));
    };
    const onPointerUp = () => stopDragging();

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onChange, stopDragging]);

  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    startX.current = ev.clientX;
    startVal.current = value;
    (ref.current as HTMLDivElement).setPointerCapture(ev.pointerId);
    (ref.current as any).__activePointerId = ev.pointerId;
    document.body.classList.add("resize-cursor-col");
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    const mult = ev.shiftKey ? 10 : 1;
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      onChange(clamp(value - step * mult));
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      onChange(clamp(value + step * mult));
    } else if (ev.key === "Home") {
      ev.preventDefault();
      onChange(min);
    } else if (ev.key === "End") {
      ev.preventDefault();
      onChange(max);
    }
  };

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      aria-controls={
        ariaControlsLeftId && ariaControlsRightId
          ? `${ariaControlsLeftId} ${ariaControlsRightId}`
          : undefined
      }
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value}px`}
      aria-describedby={descId}
      tabIndex={0}
      className={`resize-handle ${className}`}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      {/* 스크린리더 안내(현재 폭 + 조작 키) */}
      <span id={descId} className="sr-only">
        현재 폭 {value}px. 좌우 화살표로 조절, Shift+화살표로 크게 조절. Home/End로 최소/최대.
      </span>
    </div>
  );
}
