// apps/web/src/features/admin/components/users/BulkActionBar.tsx
type Props = {
  selectedCount: number;
  locked?: boolean;

  onClear: () => void;
  onExportCsv: () => void;

  onRequestActivate: () => void;
  onRequestBan: () => void;

  onRequestRoleAdmin: () => void;
  onRequestRoleUser: () => void;

  onDelete: () => void;
};

export default function BulkActionBar({
  selectedCount,
  locked,
  onClear,
  onExportCsv,
  onRequestActivate,
  onRequestBan,
  onRequestRoleAdmin,
  onRequestRoleUser,
  onDelete,
}: Props) {
  const disabled = !!locked;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-2 flex-wrap">
        <div className="text-sm font-semibold text-gray-800">
          선택: <span className="font-mono">{selectedCount}</span>명
        </div>

        {disabled ? (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
            슈퍼관리자가 포함되어 있어 벌크 액션이 비활성화됩니다.
          </div>
        ) : null}

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <button onClick={onExportCsv} className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-semibold">
          CSV 내보내기
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <button
          onClick={onRequestActivate}
          disabled={disabled}
          className={[
            "px-3 py-2 rounded-lg text-sm font-semibold",
            disabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-green-50 text-green-700 hover:bg-green-100",
          ].join(" ")}
        >
          활성화
        </button>

        <button
          onClick={onRequestBan}
          disabled={disabled}
          className={[
            "px-3 py-2 rounded-lg text-sm font-semibold",
            disabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-red-50 text-red-700 hover:bg-red-100",
          ].join(" ")}
        >
          차단
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <button
          onClick={onRequestRoleUser}
          disabled={disabled}
          className={[
            "px-3 py-2 rounded-lg text-sm font-semibold",
            disabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-50 text-gray-700 hover:bg-gray-100",
          ].join(" ")}
        >
          권한: 일반
        </button>

        <button
          onClick={onRequestRoleAdmin}
          disabled={disabled}
          className={[
            "px-3 py-2 rounded-lg text-sm font-semibold",
            disabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-50 text-gray-700 hover:bg-gray-100",
          ].join(" ")}
        >
          권한: 관리자
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <button
          onClick={onDelete}
          disabled={disabled}
          className={[
            "px-3 py-2 rounded-lg text-sm font-semibold",
            disabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700",
          ].join(" ")}
        >
          삭제
        </button>

        <button onClick={onClear} className="px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-600">
          선택 해제
        </button>
      </div>
    </div>
  );
}
