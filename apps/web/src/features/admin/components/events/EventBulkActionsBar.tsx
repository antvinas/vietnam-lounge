import React from "react";

export type BulkStatus = "upcoming" | "active" | "past";

type Props = {
  selectedCount: number;

  /** 선택 해제 */
  onClear: () => void;

  /** 벌크 삭제 */
  onDelete?: () => void;

  /** 벌크 공개/비공개 (상위에서 patch 로직 연결) */
  onSetVisibility?: (isPublic: boolean) => void;

  /** 벌크 상태 변경(선택) */
  onSetStatus?: (status: BulkStatus) => void;

  /** 벌크 복제(선택) */
  onDuplicate?: () => void;

  /** 벌크 태그 변경 (상위에서 patch 로직 연결) */
  onSetTags?: (tags: string[]) => void;

  /** 비활성화(로딩 중) */
  disabled?: boolean;

  /** 현재 선택된 id 목록을 UI에 보여주고 싶으면(선택) */
  hintText?: string;
};

export default function EventBulkActionsBar({
  selectedCount,
  onClear,
  onDelete,
  onSetVisibility,
  onSetStatus,
  onDuplicate,
  onSetTags,
  disabled,
  hintText,
}: Props) {
  const [tagInput, setTagInput] = React.useState("");

  if (selectedCount <= 0) return null;

  const btnBase =
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-extrabold transition disabled:opacity-60";

  const parseTags = (raw: string) =>
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <div className="fixed left-0 right-0 bottom-0 z-30">
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="min-w-[200px]">
            <div className="text-sm font-extrabold text-gray-900">
              선택 <span className="text-emerald-600">{selectedCount}</span>개
            </div>
            {hintText ? <div className="text-xs text-gray-500 mt-0.5">{hintText}</div> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSetVisibility ? (
              <>
                <button
                  type="button"
                  className={`${btnBase} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                  disabled={disabled}
                  onClick={() => onSetVisibility(true)}
                >
                  공개
                </button>
                <button
                  type="button"
                  className={`${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200`}
                  disabled={disabled}
                  onClick={() => onSetVisibility(false)}
                >
                  비공개
                </button>
              </>
            ) : null}

            {onSetStatus ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`${btnBase} bg-yellow-50 text-yellow-800 hover:bg-yellow-100`}
                  disabled={disabled}
                  onClick={() => onSetStatus("upcoming")}
                >
                  상태: 예정
                </button>
                <button
                  type="button"
                  className={`${btnBase} bg-green-50 text-green-800 hover:bg-green-100`}
                  disabled={disabled}
                  onClick={() => onSetStatus("active")}
                >
                  상태: 오늘
                </button>
                <button
                  type="button"
                  className={`${btnBase} bg-gray-100 text-gray-800 hover:bg-gray-200`}
                  disabled={disabled}
                  onClick={() => onSetStatus("past")}
                >
                  상태: 종료
                </button>
              </div>
            ) : null}

            {onDuplicate ? (
              <button
                type="button"
                className={`${btnBase} bg-white border border-gray-200 text-gray-800 hover:bg-gray-50`}
                disabled={disabled}
                onClick={onDuplicate}
              >
                복제
              </button>
            ) : null}

            {onSetTags ? (
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="h-10 w-56 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="태그(콤마로 구분) 예: promo,weekend"
                  disabled={disabled}
                />
                <button
                  type="button"
                  className={`${btnBase} bg-blue-50 text-blue-700 hover:bg-blue-100`}
                  disabled={disabled}
                  onClick={() => onSetTags(parseTags(tagInput))}
                >
                  태그 적용
                </button>
              </div>
            ) : null}

            {onDelete ? (
              <button
                type="button"
                className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}
                disabled={disabled}
                onClick={onDelete}
              >
                삭제
              </button>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className={`${btnBase} bg-gray-50 text-gray-700 hover:bg-gray-100`}
              onClick={onClear}
              disabled={disabled}
            >
              선택 해제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
