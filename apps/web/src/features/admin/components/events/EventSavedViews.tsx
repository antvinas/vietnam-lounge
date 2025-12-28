import React from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import Modal from "@/components/common/Modal";
import { useSavedViews } from "@/features/admin/hooks/useSavedViews";

const ALLOWED_KEYS = [
  // 기존 필터/검색/정렬/페이지
  "mode",
  "status",
  "q",
  "sort",
  "page",
  "limit",
  // 고급 필터
  "rangeStart",
  "rangeEnd",
  "city",
  "visibility",
] as const;

type Props = {
  /** 기본값: admin.events */
  scope?: "admin.events";
  /** 버튼 텍스트/레이아웃 조절하고 싶을 때 */
  compact?: boolean;
};

export default function EventSavedViews({ scope = "admin.events", compact }: Props) {
  const [sp, setSp] = useSearchParams();

  const saved = useSavedViews({
    scope,
    allowedKeys: [...ALLOWED_KEYS],
    maxItems: 20,
  });

  const [openSave, setOpenSave] = React.useState(false);
  const [openManage, setOpenManage] = React.useState(false);

  const [name, setName] = React.useState("");

  // ✅ 현재 URL 상태를 allowlist만 뽑아 저장용 query로 만든다
  const currentQuery = React.useMemo(() => saved.buildQueryFromParams(sp), [saved, sp]);

  const activeView = React.useMemo(() => {
    if (!currentQuery) return null;
    return saved.items.find((x) => x.query === currentQuery) ?? null;
  }, [saved.items, currentQuery]);

  // ✅ select 값이 "현재 적용중인 view"를 따라가게 (관리자 입장에서 훨씬 안정적)
  const [selectedId, setSelectedId] = React.useState<string>("");
  React.useEffect(() => {
    setSelectedId(activeView?.id || "");
  }, [activeView?.id]);

  const currentLabel = React.useMemo(() => {
    if (!currentQuery) return "현재 보기";
    return activeView ? activeView.name : "현재 보기";
  }, [currentQuery, activeView]);

  const applyQuery = (query: string) => {
    const q = query?.trim() || "";
    const next = new URLSearchParams(sp);

    // ✅ Saved View 적용 시 "일회성/특수 파라미터"는 제거하는 게 운영 안전
    // 예: focus=... 가 남아있으면 다른 뷰를 적용해도 특정 행만 계속 강조될 수 있음
    next.delete("focus");

    // 먼저 allowlist 키는 제거
    ALLOWED_KEYS.forEach((k) => next.delete(k));

    // 저장된 query를 반영
    const from = new URLSearchParams(q);
    ALLOWED_KEYS.forEach((k) => {
      const vals = from.getAll(k);
      vals.forEach((v) => next.append(k, v));
    });

    setSp(next);
    toast.success("저장된 보기를 적용했습니다.");
  };

  // ===== Save Modal =====
  const openSaveModal = () => {
    const suggested = currentLabel === "현재 보기" ? "" : currentLabel;
    setName(suggested);
    setOpenSave(true);
  };

  const doSave = () => {
    try {
      if (!currentQuery) {
        toast.error("저장할 필터/정렬 상태가 없습니다.");
        return;
      }
      saved.upsert(name, currentQuery);
      setOpenSave(false);
      toast.success("저장했습니다.");
    } catch (e: any) {
      if (String(e?.message) === "name_required") toast.error("이름을 입력해 주세요.");
      else if (String(e?.message) === "query_required") toast.error("저장할 상태가 없습니다.");
      else toast.error("저장에 실패했습니다.");
    }
  };

  // ===== Manage Modal (rename/delete/clearall을 prompt/confirm 대신 Modal로 일관 UX) =====
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameId, setRenameId] = React.useState<string>("");
  const [renameValue, setRenameValue] = React.useState<string>("");

  const openRename = (id: string) => {
    const v = saved.findById(id);
    if (!v) return;
    setRenameId(id);
    setRenameValue(v.name);
    setRenameOpen(true);
  };

  const doRename = () => {
    if (!renameId) return;
    try {
      saved.rename(renameId, renameValue);
      toast.success("이름을 변경했습니다.");
      setRenameOpen(false);
      setRenameId("");
      setRenameValue("");
    } catch {
      toast.error("이름 변경 실패");
    }
  };

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string>("");

  const openDelete = (id: string) => {
    const v = saved.findById(id);
    if (!v) return;
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const doDelete = () => {
    if (!deleteId) return;
    saved.remove(deleteId);
    toast.success("삭제했습니다.");
    setDeleteOpen(false);
    setDeleteId("");
  };

  const [clearAllOpen, setClearAllOpen] = React.useState(false);
  const doClearAll = () => {
    saved.clearAll();
    toast.success("전체 삭제했습니다.");
    setClearAllOpen(false);
  };

  const btnBase = "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-extrabold transition";
  const chipBase =
    "admin-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold border transition";

  const deletingView = deleteId ? saved.findById(deleteId) : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Dropdown */}
      <div className="flex items-center gap-2">
        <select
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold outline-none"
          value={selectedId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedId(id);
            if (!id) return;
            const v = saved.findById(id);
            if (v) applyQuery(v.query);
          }}
          aria-label="Saved Views"
        >
          <option value="">{saved.items.length ? `Saved Views (${saved.items.length})` : "Saved Views 없음"}</option>
          {saved.items.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`${btnBase} ${compact ? "h-10" : ""} bg-gray-100 hover:bg-gray-200`}
          onClick={openSaveModal}
          title="현재 필터/정렬/페이지를 저장"
        >
          + 저장
        </button>

        <button
          type="button"
          className={`${btnBase} ${compact ? "h-10" : ""} bg-white border border-gray-200 hover:bg-gray-50`}
          onClick={() => setOpenManage(true)}
          title="저장된 보기 관리"
        >
          관리
        </button>
      </div>

      {/* Chips (최근 4개 빠른 적용) */}
      {saved.items.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {saved.items.slice(0, 4).map((v) => {
            const active = currentQuery && v.query === currentQuery;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => applyQuery(v.query)}
                className={[
                  chipBase,
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
                aria-pressed={active}
              >
                {v.name}
                <span className={active ? "opacity-80" : "text-gray-400"}>→</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Save Modal */}
      <Modal
        isOpen={openSave}
        onClose={() => setOpenSave(false)}
        title="Saved View 저장"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
              onClick={() => setOpenSave(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-extrabold"
              onClick={doSave}
              disabled={!currentQuery || !name.trim()}
            >
              저장
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-700">현재 적용 중인 필터/정렬 상태를 “보기”로 저장합니다. (URL 기반)</div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">이름</label>
            <input
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 하노이 이번주 공개 이벤트"
              autoFocus
            />
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
            저장 내용(쿼리): <span className="font-mono break-all">{currentQuery || "(없음)"}</span>
          </div>
        </div>
      </Modal>

      {/* Manage Modal */}
      <Modal
        isOpen={openManage}
        onClose={() => setOpenManage(false)}
        title="Saved Views 관리"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
              onClick={() => setOpenManage(false)}
            >
              닫기
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold"
              onClick={() => setClearAllOpen(true)}
              disabled={!saved.items.length}
            >
              전체 삭제
            </button>
          </div>
        }
      >
        {!saved.items.length ? (
          <div className="text-sm text-gray-600">저장된 보기가 없습니다. 상단에서 “+ 저장”으로 추가해 주세요.</div>
        ) : (
          <div className="space-y-2">
            {saved.items.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-gray-200 bg-white p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-gray-900 truncate">{v.name}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono break-all">{v.query}</div>
                  <div className="text-[11px] text-gray-400 mt-1">업데이트: {new Date(v.updatedAt).toLocaleString()}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-extrabold"
                    onClick={() => applyQuery(v.query)}
                  >
                    적용
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold"
                    onClick={() => openRename(v.id)}
                  >
                    이름
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-extrabold"
                    onClick={() => openDelete(v.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="이름 변경"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
              onClick={() => setRenameOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-extrabold"
              onClick={doRename}
              disabled={!renameValue.trim()}
            >
              변경
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700">새 이름</label>
          <input
            className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete confirm Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Saved View 삭제"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
              onClick={() => setDeleteOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold"
              onClick={doDelete}
            >
              삭제
            </button>
          </div>
        }
      >
        <div className="text-sm text-gray-700">
          {deletingView ? (
            <>
              <span className="font-extrabold">“{deletingView.name}”</span> 보기를 삭제할까요?
            </>
          ) : (
            "선택한 보기를 삭제할까요?"
          )}
        </div>
      </Modal>

      {/* Clear all confirm Modal */}
      <Modal
        isOpen={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        title="Saved Views 전체 삭제"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
              onClick={() => setClearAllOpen(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold"
              onClick={doClearAll}
            >
              전체 삭제
            </button>
          </div>
        }
      >
        <div className="text-sm text-gray-700">
          저장된 보기를 <span className="font-extrabold">모두</span> 삭제할까요? (되돌릴 수 없어요)
        </div>
      </Modal>
    </div>
  );
}
