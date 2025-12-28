// src/hooks/useUndo.ts
import React, { useCallback } from "react";
import toast from "react-hot-toast";

/**
 * 삭제/이동을 Undo 가능한 액션으로 감싸는 헬퍼.
 * 실제 데이터 조작은 호출자가 수행하고,
 * 이 훅은 "되돌리기" 토스트 UI만 담당한다.
 */
export type UndoableDeleteParams = {
  /** 사용자에게 보여줄 항목 이름 (예: "맛집 A") */
  label: string;
  /** 실제 삭제 수행 함수 */
  onDelete: () => void;
  /** 되돌리기 수행 함수 */
  onRestore: () => void;
  /** 스낵바 표시 시간(ms). 기본 5000 */
  duration?: number;
};

export type UndoableMoveParams<TSnapshot> = {
  /** 사용자에게 보여줄 항목 이름 (예: "2일차 일정") */
  label: string;
  /** 되돌릴 때 쓸 스냅샷(원래 상태) */
  snapshot: TSnapshot;
  /** 실제 이동 수행 함수 */
  onMove: () => void;
  /** 되돌리기 수행 함수 (snapshot을 다시 적용) */
  onRestore: (snapshot: TSnapshot) => void;
  /** 스낵바 표시 시간(ms). 기본 5000 */
  duration?: number;
};

type ToastOptions = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

/**
 * 공통 토스트 렌더러
 * - message만 있으면 일반 토스트
 * - actionLabel + onAction 있으면 "되돌리기" 버튼이 있는 커스텀 토스트
 *
 * ⚠ JSX를 쓰면 .ts에서 빌드가 깨지므로 React.createElement로만 구성
 */
function showUndoToast({
  message,
  actionLabel = "되돌리기",
  onAction,
  duration = 5000,
}: ToastOptions) {
  // 액션 없는 단순 토스트
  if (!onAction) {
    toast(message, { duration });
    return;
  }

  // 되돌리기 버튼 포함 커스텀 토스트
  toast.custom(
    (t) =>
      React.createElement(
        "div",
        {
          className:
            "flex items-center gap-3 rounded-md bg-neutral-900 px-3 py-2 text-sm text-white shadow-lg",
        },
        React.createElement(
          "span",
          { className: "truncate" },
          message
        ),
        React.createElement(
          "button",
          {
            className:
              "ml-auto rounded border border-white/30 px-2 py-0.5 text-xs font-semibold hover:bg-white/10",
            onClick: () => {
              try {
                onAction();
              } finally {
                toast.dismiss(t.id);
              }
            },
          },
          actionLabel
        )
      ),
    {
      duration,
    }
  );
}

/**
 * useUndo 훅
 * - deleteWithUndo: 삭제 + 되돌리기 토스트
 * - moveWithUndo: 이동 + 되돌리기 토스트
 */
export default function useUndo() {
  const deleteWithUndo = useCallback(
    ({ label, onDelete, onRestore, duration }: UndoableDeleteParams) => {
      // 1) 실제 삭제 먼저 수행
      onDelete();

      // 2) "되돌리기" 토스트 노출
      showUndoToast({
        message: `삭제됨: ${label}`,
        actionLabel: "되돌리기",
        onAction: onRestore,
        duration,
      });
    },
    []
  );

  const moveWithUndo = useCallback(
    <TSnapshot,>({
      label,
      snapshot,
      onMove,
      onRestore,
      duration,
    }: UndoableMoveParams<TSnapshot>) => {
      // 1) 실제 이동 먼저 수행
      onMove();

      // 2) "되돌리기" 토스트 노출
      showUndoToast({
        message: `이동됨: ${label}`,
        actionLabel: "되돌리기",
        onAction: () => onRestore(snapshot),
        duration,
      });
    },
    []
  );

  return { deleteWithUndo, moveWithUndo };
}
