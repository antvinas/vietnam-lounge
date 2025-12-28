// apps/web/src/features/admin/pages/ManageEvents.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaSearch, FaPlus, FaRegClock, FaRegCheckCircle, FaRegTimesCircle, FaSlidersH } from "react-icons/fa";

import Modal from "@/components/common/Modal";
import Pagination from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import DensityToggle from "@/components/common/DensityToggle";

import EventPreviewPanel from "@/features/admin/components/events/EventPreviewPanel";
import EventRowActions from "@/features/admin/components/events/EventRowActions";
import EventSavedViews from "@/features/admin/components/events/EventSavedViews";
import EventAdvancedFilters from "@/features/admin/components/events/EventAdvancedFilters";
import EventBulkActionsBar, { type BulkStatus } from "@/features/admin/components/events/EventBulkActionsBar";

import { useRowSelection } from "@/features/admin/hooks/useRowSelection";
import { parseYmdLocal, formatRange, toDateMaybe } from "@/features/admin/utils/datetime";

import { addEvent, deleteEvent, getEvents, updateEvent } from "@/features/admin/api/admin.api";
import type { AdminEventData } from "@/features/admin/api/types";

// =========================================================
// Types / helpers
// =========================================================
type ModeFilter = "all" | "explorer" | "nightlife";
type RecordFilter = "all" | "active" | "draft" | "deleted";

type SortKey = "date_desc" | "date_asc" | "updated_desc" | "title_asc";
type VisibilityFilter = "all" | "public" | "private";

const clampInt = (value: any, min: number, max: number, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
};

const normalizeMode = (value: any): ModeFilter => {
  const v = String(value || "").trim();
  if (v === "explorer" || v === "nightlife") return v;
  return "all";
};

const normalizeRecord = (value: any): RecordFilter => {
  const v = String(value || "").trim();
  if (v === "active" || v === "draft" || v === "deleted") return v;
  return "all";
};

const normalizeSort = (value: any): SortKey => {
  const v = String(value || "").trim();
  if (v === "date_asc" || v === "updated_desc" || v === "title_asc") return v;
  return "date_desc";
};

const normalizeVisibility = (value: any): VisibilityFilter => {
  const v = String(value || "").trim();
  if (v === "public" || v === "private") return v;
  return "all";
};

const recordText = (s: RecordFilter) => {
  if (s === "active") return "활성";
  if (s === "draft") return "초안";
  if (s === "deleted") return "삭제됨(휴지통)";
  return "전체";
};

type TimeStatus = "upcoming" | "active" | "past";

const getTimeStatus = (e: AdminEventData): TimeStatus => {
  // 명시 status가 (upcoming/active/past)인 경우 우선 사용
  const explicit = String((e as any)?.status || "").trim();
  if (explicit === "upcoming" || explicit === "active" || explicit === "past") return explicit;

  const start = parseYmdLocal((e as any).date);
  const end = parseYmdLocal((e as any).endDate || (e as any).date);

  if (!start) return "upcoming";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : startDay;

  if (endDay < today) return "past";
  if (startDay > today) return "upcoming";
  return "active";
};

const getRecordStatus = (e: AdminEventData): Exclude<RecordFilter, "all"> => {
  const st = String((e as any)?.status || "").trim();
  if (st === "deleted" || (e as any)?.deletedAt) return "deleted";
  if (st === "draft") return "draft";
  return "active";
};

type RecordSummary = { all: number; active: number; draft: number; deleted: number };

const calcSummary = (list: AdminEventData[]): RecordSummary => {
  let active = 0;
  let draft = 0;
  let deleted = 0;

  for (const e of list) {
    const rs = getRecordStatus(e);
    if (rs === "deleted") deleted += 1;
    else if (rs === "draft") draft += 1;
    else active += 1;
  }

  return { all: active + draft, active, draft, deleted };
};

const getStartDate = (e: AdminEventData) => parseYmdLocal((e as any).date);
const getUpdatedAt = (e: AdminEventData) => toDateMaybe((e as any).updatedAt)?.getTime() ?? 0;

const uniq = (arr: string[]) => Array.from(new Set(arr));
const safeLower = (s: any) => String(s || "").toLowerCase().trim();

type ToneKey = "slate" | "green" | "yellow" | "gray";
const TONE_ICON_CLASS: Record<ToneKey, string> = {
  slate: "text-slate-600",
  green: "text-green-600",
  yellow: "text-yellow-600",
  gray: "text-gray-600",
};

// =========================================================
// Component
// =========================================================
export default function ManageEvents() {
  const [sp, setSp] = useSearchParams();

  const initialMode = normalizeMode(sp.get("mode"));
  const initialStatus = normalizeRecord(sp.get("status"));
  const initialQ = (sp.get("q") || "").trim();
  const initialSort = normalizeSort(sp.get("sort"));
  const initialPage = clampInt(sp.get("page"), 1, 9999, 1);
  const initialLimit = clampInt(sp.get("limit"), 20, 200, 20);

  const initialRangeStart = (sp.get("rangeStart") || "").trim();
  const initialRangeEnd = (sp.get("rangeEnd") || "").trim();
  const initialCity = (sp.get("city") || "").trim();
  const initialVisibility = normalizeVisibility(sp.get("visibility"));

  const focusId = (sp.get("focus") || "").trim();

  const [mode, setMode] = useState<ModeFilter>(initialMode);
  const [status, setStatus] = useState<RecordFilter>(initialStatus);
  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState(initialRangeStart);
  const [rangeEnd, setRangeEnd] = useState(initialRangeEnd);
  const [city, setCity] = useState(initialCity);
  const [visibility, setVisibility] = useState<VisibilityFilter>(initialVisibility);

  const [events, setEvents] = useState<AdminEventData[]>([]);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<RecordSummary>({ all: 0, active: 0, draft: 0, deleted: 0 });

  const [pulseStatus, setPulseStatus] = useState<RecordFilter | null>(null);
  const statusBtnRefs = useRef<Record<RecordFilter, HTMLButtonElement | null>>({
    all: null,
    active: null,
    draft: null,
    deleted: null,
  });

  const tableAnchorRef = useRef<HTMLDivElement | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<AdminEventData | null>(null);

  const [activeId, setActiveId] = useState<string>("");

  // 삭제(휴지통 이동) 모달
  const [deleteTarget, setDeleteTarget] = useState<AdminEventData | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isTrashView = status === "deleted";

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewEvent(null);
  };

  const openPreview = (e: AdminEventData) => {
    setPreviewEvent(e);
    setPreviewOpen(true);
    const id = String((e as any)?.id || "");
    if (id) setActiveId(id);
  };

  const getEditTo = (e: AdminEventData | null) => {
    if (!e) return "";
    const id = String((e as any)?.id || "");
    const modeVal = (e as any)?.mode || "explorer";
    return `/admin/events/${id}/edit?mode=${encodeURIComponent(modeVal)}`;
  };

  const copyAdminEditLink = async (e: AdminEventData) => {
    const id = String((e as any)?.id || "");
    if (!id) return;

    const modeVal = (e as any)?.mode || "explorer";
    const url = `${window.location.origin}/admin/events/${id}/edit?mode=${encodeURIComponent(modeVal)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("편집 링크를 복사했어요.");
    } catch {
      toast.error("복사 실패");
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
      setSummary(calcSummary(Array.isArray(data) ? data : []));
    } catch (e) {
      console.error(e);
      toast.error("이벤트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL sync (Saved Views 포함)
  useEffect(() => {
    const next = new URLSearchParams(sp);

    if (mode !== "all") next.set("mode", mode);
    else next.delete("mode");

    if (status !== "all") next.set("status", status);
    else next.delete("status");

    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");

    if (sort !== "date_desc") next.set("sort", sort);
    else next.delete("sort");

    if (page !== 1) next.set("page", String(page));
    else next.delete("page");

    if (limit !== 20) next.set("limit", String(limit));
    else next.delete("limit");

    if (rangeStart.trim()) next.set("rangeStart", rangeStart.trim());
    else next.delete("rangeStart");

    if (rangeEnd.trim()) next.set("rangeEnd", rangeEnd.trim());
    else next.delete("rangeEnd");

    if (city.trim()) next.set("city", city.trim());
    else next.delete("city");

    if (visibility !== "all") next.set("visibility", visibility);
    else next.delete("visibility");

    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status, q, sort, page, limit, rangeStart, rangeEnd, city, visibility]);

  // filter가 바뀌면 page=1
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, status, q, sort, limit, rangeStart, rangeEnd, city, visibility]);

  // focus 이동
  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`event-row-${focusId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, events]);

  // summary 재계산
  useEffect(() => {
    setSummary(calcSummary(events));
  }, [events]);

  const cityOptions = useMemo(() => {
    const list = events.map((e) => String((e as any)?.city || "").trim()).filter(Boolean);
    return uniq(list).sort((a, b) => a.localeCompare(b));
  }, [events]);

  // =========================================================
  // Filtering / sorting
  // =========================================================
  const filteredAll = useMemo(() => {
    const qLower = safeLower(q);

    const startBound = rangeStart ? parseYmdLocal(rangeStart) : null;
    const endBound = rangeEnd ? parseYmdLocal(rangeEnd) : null;

    const cityLower = safeLower(city);

    return events
      .filter((e) => {
        const m = String((e as any)?.mode || "explorer");
        if (mode !== "all" && m !== mode) return false;

        const rs = getRecordStatus(e);
        if (status === "deleted") {
          if (rs !== "deleted") return false;
        } else if (status === "draft") {
          if (rs !== "draft") return false;
        } else if (status === "active") {
          if (rs !== "active") return false;
        } else {
          // all: deleted 제외
          if (rs === "deleted") return false;
        }

        if (qLower) {
          const t = safeLower((e as any)?.title);
          const loc = safeLower((e as any)?.location);
          const c = safeLower((e as any)?.city);
          if (!t.includes(qLower) && !loc.includes(qLower) && !c.includes(qLower)) return false;
        }

        if (cityLower) {
          if (safeLower((e as any)?.city) !== cityLower) return false;
        }

        if (visibility !== "all") {
          const isPublic = Boolean((e as any)?.isPublic);
          const vis = String((e as any)?.visibility || "").trim();
          const effectivePublic = vis ? vis === "public" : isPublic;

          if (visibility === "public" && !effectivePublic) return false;
          if (visibility === "private" && effectivePublic) return false;
        }

        if (startBound || endBound) {
          const start = getStartDate(e);
          const end = parseYmdLocal((e as any)?.endDate || (e as any)?.date);

          if (startBound && start && start < startBound) return false;
          if (endBound) {
            const targetEnd = end || start;
            if (targetEnd && targetEnd > endBound) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "updated_desc") return getUpdatedAt(b) - getUpdatedAt(a);
        if (sort === "title_asc") return safeLower((a as any).title).localeCompare(safeLower((b as any).title));

        const da = getStartDate(a);
        const db = getStartDate(b);
        const va = da ? da.getTime() : 0;
        const vb = db ? db.getTime() : 0;

        if (sort === "date_asc") return va - vb;
        return vb - va; // date_desc
      });
  }, [events, mode, status, q, sort, rangeStart, rangeEnd, city, visibility]);

  const totalPages = Math.max(1, Math.ceil(filteredAll.length / limit));
  const pageSafe = Math.max(1, Math.min(page, totalPages));
  const startIndex = (pageSafe - 1) * limit;
  const endIndex = startIndex + limit;

  const paged = filteredAll.slice(startIndex, endIndex);
  const pagedIds = useMemo(() => paged.map((e) => String((e as any)?.id || "")).filter(Boolean), [paged]);

  // =========================================================
  // Selection (bulk actions)  ✅ 훅 시그니처에 맞춤
  // =========================================================
  const selection = useRowSelection(pagedIds, { pruneOnVisibleChange: true });
  const headerCbRef = useRef<HTMLInputElement | null>(null);

  const headerState = useMemo(() => {
    if (!pagedIds.length) return { checked: false, indeterminate: false, disabled: true };
    const selected = pagedIds.filter((id) => selection.isSelected(id)).length;
    const checked = selected === pagedIds.length;
    const indeterminate = selected > 0 && selected < pagedIds.length;
    return { checked, indeterminate, disabled: false };
  }, [pagedIds, selection]);

  useEffect(() => {
    const el = headerCbRef.current;
    if (!el) return;
    el.indeterminate = headerState.indeterminate;
  }, [headerState.indeterminate]);

  // 탭 변경 시: 프리뷰/선택 초기화(특히 휴지통 진입 시 사고 방지)
  useEffect(() => {
    closePreview();
    selection.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, mode]);

  const selectionHint = useMemo(() => {
    if (selection.selectedCount <= 0) return "";
    return `${selection.selectedCount}개 선택됨`;
  }, [selection.selectedCount]);

  const [bulkBusy, setBulkBusy] = useState(false);

  const summarize = (label: string, ok: number, fail: number) => {
    if (fail === 0) toast.success(`${label}: ${ok}건 완료`);
    else toast(`${label}: 성공 ${ok} · 실패 ${fail}`, { icon: fail ? "⚠️" : "✅" });
  };

  // ✅ 휴지통 탭에서는 벌크 액션 자체를 숨김 (사고 방지)
  const renderBulkBar = !isTrashView;

  // =========================================================
  // Actions
  // =========================================================
  const handleDuplicate = async (e: AdminEventData) => {
    const modeVal = (e as any)?.mode || "explorer";
    const copy: AdminEventData = {
      ...(e as any),
      id: undefined as any,
      mode: modeVal,
      title: `${String((e as any).title || "").trim()} (복제)`,
    };
    try {
      await addEvent(copy);
      toast.success("복제 완료");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("복제 실패");
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteText("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteText.trim() !== "DELETE") {
      toast.error('휴지통으로 이동하려면 "DELETE" 를 입력하세요.');
      return;
    }

    const targetId = String((deleteTarget as any)?.id || "");
    if (!targetId) return;

    setDeleting(true);

    const prevSnapshot = events.find((x) => String((x as any)?.id || "") === targetId) || deleteTarget;

    setEvents((prev) =>
      prev.map((e) => {
        const id = String((e as any)?.id || "");
        if (id !== targetId) return e;
        return { ...(e as any), status: "deleted", deletedAt: new Date().toISOString() } as any;
      })
    );

    try {
      await deleteEvent(targetId);
      toast.success("휴지통으로 이동했습니다.");
      closeDeleteModal();
    } catch (err) {
      console.error(err);
      setEvents((prev) =>
        prev.map((e) => {
          const id = String((e as any)?.id || "");
          if (id !== targetId) return e;
          return prevSnapshot as any;
        })
      );
      toast.error("처리 실패");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ 휴지통에서만 복구 가능
  const restoreEventFromTrash = async (e: AdminEventData) => {
    if (!isTrashView) return;

    const id = String((e as any)?.id || "").trim();
    if (!id) return;

    const first = window.confirm("이 이벤트를 복구하시겠습니까?\n복구 후에는 ‘초안’으로 돌아갑니다.");
    if (!first) return;

    const ok = window.prompt(`복구하려면 RESTORE 를 입력하세요.`);
    if (ok !== "RESTORE") return;

    const loadingId = toast.loading("복구 중...");

    const restorePayload: AdminEventData = {
      ...(e as any),
      status: "draft",
      deletedAt: null as any,
      deletedBy: null as any,
      isPublic: false as any,
      visibility: "private" as any,
    };

    setEvents((prev) =>
      prev.map((x) => {
        const xid = String((x as any)?.id || "");
        if (xid !== id) return x;
        return restorePayload as any;
      })
    );

    try {
      await updateEvent(id, restorePayload as any);
      toast.success("복구 완료 (초안)", { id: loadingId });
    } catch (err) {
      console.error(err);
      toast.error("복구 실패", { id: loadingId });
      await load();
    }
  };

  const bulkUpdateVisibility = async (nextPublic: boolean) => {
    const ids = selection.selectedIds;
    if (!ids.length) return;

    setBulkBusy(true);

    const prevMap = new Map<string, { isPublic?: boolean; visibility?: string }>();
    const byId = new Map<string, AdminEventData>();

    setEvents((prev) => {
      prev.forEach((e) => {
        const id = String((e as any)?.id || "");
        if (!id) return;
        if (ids.includes(id)) {
          prevMap.set(id, { isPublic: (e as any)?.isPublic, visibility: (e as any)?.visibility });
          byId.set(id, e);
        }
      });

      return prev.map((e) => {
        const id = String((e as any)?.id || "");
        if (!ids.includes(id)) return e;
        return { ...(e as any), isPublic: nextPublic, visibility: nextPublic ? "public" : "private" } as any;
      });
    });

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const base = byId.get(id);
        if (!base) throw new Error("not_found_in_state");
        const payload: AdminEventData = {
          ...(base as any),
          isPublic: nextPublic as any,
          visibility: (nextPublic ? "public" : "private") as any,
        };
        return updateEvent(id, payload as any);
      })
    );

    let ok = 0;
    let fail = 0;

    results.forEach((r, i) => {
      const id = ids[i];
      if (r.status === "fulfilled") ok += 1;
      else {
        fail += 1;
        const snap = prevMap.get(id);
        setEvents((prev) =>
          prev.map((e) => {
            const eid = String((e as any)?.id || "");
            if (eid !== id) return e;
            return { ...(e as any), isPublic: snap?.isPublic, visibility: snap?.visibility } as any;
          })
        );
      }
    });

    summarize("공개 설정", ok, fail);
    setBulkBusy(false);
    selection.clear();
  };

  const bulkUpdateStatus = async (next: BulkStatus) => {
    const ids = selection.selectedIds;
    if (!ids.length) return;

    setBulkBusy(true);

    const prevMap = new Map<string, { status?: string }>();
    const byId = new Map<string, AdminEventData>();

    setEvents((prev) => {
      prev.forEach((e) => {
        const id = String((e as any)?.id || "");
        if (!id) return;
        if (ids.includes(id)) {
          prevMap.set(id, { status: String((e as any)?.status || "") });
          byId.set(id, e);
        }
      });

      return prev.map((e) => {
        const id = String((e as any)?.id || "");
        if (!ids.includes(id)) return e;
        return { ...(e as any), status: next } as any;
      });
    });

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const base = byId.get(id);
        if (!base) throw new Error("not_found_in_state");
        const payload: AdminEventData = { ...(base as any), status: next as any };
        return updateEvent(id, payload as any);
      })
    );

    let ok = 0;
    let fail = 0;

    results.forEach((r, i) => {
      const id = ids[i];
      if (r.status === "fulfilled") ok += 1;
      else {
        fail += 1;
        const snap = prevMap.get(id);
        setEvents((prev) =>
          prev.map((e) => {
            const eid = String((e as any)?.id || "");
            if (eid !== id) return e;
            return { ...(e as any), status: snap?.status } as any;
          })
        );
      }
    });

    summarize("상태 변경", ok, fail);
    setBulkBusy(false);
    selection.clear();
  };

  // 벌크 삭제(휴지통 이동)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteText, setBulkDeleteText] = useState("");

  const openBulkDelete = () => {
    if (selection.selectedCount <= 0) return;
    setBulkDeleteText("");
    setBulkDeleteOpen(true);
  };

  const closeBulkDelete = () => {
    setBulkDeleteOpen(false);
    setBulkDeleteText("");
  };

  const confirmBulkDelete = async () => {
    const ids = selection.selectedIds;
    if (!ids.length) return;

    if (bulkDeleteText.trim() !== "DELETE") {
      toast.error('휴지통으로 이동하려면 "DELETE" 를 입력하세요.');
      return;
    }

    setBulkBusy(true);

    const prevMap = new Map<string, AdminEventData>();
    events.forEach((e) => {
      const id = String((e as any)?.id || "");
      if (ids.includes(id)) prevMap.set(id, e);
    });

    setEvents((prev) =>
      prev.map((e) => {
        const id = String((e as any)?.id || "");
        if (!ids.includes(id)) return e;
        return { ...(e as any), status: "deleted", deletedAt: new Date().toISOString() } as any;
      })
    );

    const results = await Promise.allSettled(ids.map((id) => deleteEvent(id)));

    let ok = 0;
    let fail = 0;
    const failedIds: string[] = [];

    results.forEach((r, i) => {
      const id = ids[i];
      if (r.status === "fulfilled") ok += 1;
      else {
        fail += 1;
        failedIds.push(id);
      }
    });

    if (failedIds.length) {
      setEvents((prev) =>
        prev.map((e) => {
          const id = String((e as any)?.id || "");
          if (!failedIds.includes(id)) return e;
          return (prevMap.get(id) || e) as any;
        })
      );
    }

    closeBulkDelete();
    summarize("벌크 휴지통 이동", ok, fail);

    setBulkBusy(false);
    selection.clear();
  };

  const bulkDuplicate = async () => {
    const ids = selection.selectedIds;
    if (!ids.length) return;

    setBulkBusy(true);

    const selectedEvents = events.filter((e) => ids.includes(String((e as any)?.id || "")));

    const results = await Promise.allSettled(
      selectedEvents.map(async (e) => {
        const copy: AdminEventData = {
          ...(e as any),
          id: undefined as any,
          title: `${String((e as any).title || "").trim()} (복제)`,
        };
        return addEvent(copy);
      })
    );

    let ok = 0;
    let fail = 0;
    results.forEach((r) => {
      if (r.status === "fulfilled") ok += 1;
      else fail += 1;
    });

    await load();

    summarize("벌크 복제", ok, fail);
    setBulkBusy(false);
    selection.clear();
  };

  // =========================================================
  // UI helpers
  // =========================================================
  const triggerPulse = (value: RecordFilter) => {
    setPulseStatus(value);
    window.setTimeout(() => setPulseStatus(null), 500);
  };

  const statusBtn = (value: RecordFilter, label: string, icon?: React.ReactNode) => {
    const active = status === value;
    const isPulse = pulseStatus === value;

    return (
      <button
        type="button"
        ref={(el) => (statusBtnRefs.current[value] = el)}
        onClick={() => {
          setStatus(value);
          triggerPulse(value);
          tableAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className={[
          "admin-action-btn inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-extrabold border transition",
          active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
          isPulse ? "ring-2 ring-blue-300" : "",
        ].join(" ")}
        aria-pressed={active}
      >
        {icon}
        {label}
      </button>
    );
  };

  const applied = useMemo(() => {
    const chips: string[] = [];
    if (mode !== "all") chips.push(mode === "nightlife" ? "Nightlife" : "Explorer");
    if (status !== "all") chips.push(recordText(status));
    if (q.trim()) chips.push(`검색: ${q.trim()}`);
    if (visibility !== "all") chips.push(visibility === "public" ? "공개" : "비공개");
    if (city.trim()) chips.push(`도시: ${city.trim()}`);
    if (rangeStart || rangeEnd) chips.push("기간");
    return chips;
  }, [mode, status, q, visibility, city, rangeStart, rangeEnd]);

  const appliedFilterCount = applied.length;

  const stickyLabel = useMemo(() => {
    return {
      s: recordText(status),
      n: filteredAll.length,
    };
  }, [status, filteredAll.length]);

  const statCard = (key: RecordFilter, label: string, value: number, tone: ToneKey, icon: React.ReactNode) => {
    const active = status === key;
    return (
      <button
        type="button"
        onClick={() => setStatus(key)}
        className={[
          "admin-stat-card",
          active ? "ring-2 ring-slate-300" : "",
          "rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-700">
            <span className={TONE_ICON_CLASS[tone]}>{icon}</span>
            {label}
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        </div>
      </button>
    );
  };

  const tableKeyHandler = (ev: React.KeyboardEvent) => {
    if (ev.key === "Escape") closePreview();
  };

  const previewRecord = previewEvent ? getRecordStatus(previewEvent) : null;
  const previewEditable = previewRecord !== "deleted" && !isTrashView;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <EventPreviewPanel
        open={previewOpen}
        event={previewEvent}
        editTo={previewEditable ? getEditTo(previewEvent) : undefined}
        onClose={closePreview}
        onCopyLink={previewEditable && previewEvent ? () => void copyAdminEditLink(previewEvent) : undefined}
        onDuplicate={previewEditable && previewEvent ? () => void handleDuplicate(previewEvent) : undefined}
        onDelete={
          previewEditable && previewEvent
            ? () => {
                setDeleteTarget(previewEvent);
                setDeleteText("");
              }
            : undefined
        }
      />

      {renderBulkBar ? (
        <EventBulkActionsBar
          selectedCount={selection.selectedCount}
          hintText={selectionHint}
          disabled={bulkBusy}
          onClear={selection.clear}
          onSetVisibility={(isPublic) => void bulkUpdateVisibility(isPublic)}
          onSetStatus={(s) => void bulkUpdateStatus(s)}
          onDuplicate={() => void bulkDuplicate()}
          onDelete={openBulkDelete}
        />
      ) : null}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-[320px]">
          <h1 className="visually-hidden">이벤트 관리</h1>

          <div className="admin-stats mt-4">
            {statCard("all", "전체", summary.all, "slate", <FaRegCheckCircle />)}
            {statCard("active", "활성", summary.active, "green", <FaRegCheckCircle />)}
            {statCard("draft", "초안", summary.draft, "yellow", <FaRegClock />)}
            {statCard("deleted", "삭제됨", summary.deleted, "gray", <FaRegTimesCircle />)}
          </div>

          <div className="mt-3 admin-result-line">
            결과 <span className="font-extrabold">{filteredAll.length}</span>건{" "}
            <span className="text-gray-400">(전체 {events.length}건)</span> ·{" "}
            {appliedFilterCount > 0 ? `필터 ${appliedFilterCount}개 적용됨` : "필터 없음"}
          </div>

          {applied.length ? (
            <div className="mt-2 flex gap-2 flex-wrap">
              {applied.map((c) => (
                <span key={c} className="admin-chip px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold">
                  {c}
                </span>
              ))}
            </div>
          ) : null}

          {focusId ? (
            <div className="text-xs text-gray-500 mt-2">
              포커스: <span className="font-mono">{focusId}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <DensityToggle />
          <Link
            to="/admin/events/new"
            className="admin-action-btn inline-flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FaPlus /> 이벤트 등록
          </Link>
        </div>
      </div>

      <div className="admin-toolbar bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이벤트명/장소로 검색 (q=)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          className="px-3 py-2 rounded-lg border border-gray-300 outline-none"
          value={mode}
          onChange={(e) => setMode(e.target.value as ModeFilter)}
          aria-label="모드 필터"
        >
          <option value="all">전체</option>
          <option value="explorer">Explorer (Day)</option>
          <option value="nightlife">Nightlife (Night)</option>
        </select>

        <select
          className="px-3 py-2 rounded-lg border border-gray-300 outline-none"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="정렬"
        >
          <option value="date_desc">시작일(최신)</option>
          <option value="date_asc">시작일(오래된)</option>
          <option value="updated_desc">업데이트(최신)</option>
          <option value="title_asc">가나다</option>
        </select>

        <select
          className="px-3 py-2 rounded-lg border border-gray-300 outline-none"
          value={limit}
          onChange={(e) => setLimit(clampInt(e.target.value, 20, 200, 20))}
          aria-label="표시 개수"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <EventSavedViews compact />

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="admin-action-btn inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-extrabold"
          aria-expanded={advancedOpen}
        >
          <FaSlidersH /> 고급 필터
        </button>

        <button
          onClick={load}
          className="admin-action-btn px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
        >
          새로고침
        </button>
      </div>

      <EventAdvancedFilters
        open={advancedOpen}
        onToggle={() => setAdvancedOpen((v) => !v)}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        city={city}
        visibility={visibility}
        cityOptions={cityOptions}
        onChange={(patch) => {
          if (patch.rangeStart !== undefined) setRangeStart(patch.rangeStart);
          if (patch.rangeEnd !== undefined) setRangeEnd(patch.rangeEnd);
          if (patch.city !== undefined) setCity(patch.city);
          if (patch.visibility !== undefined) setVisibility(patch.visibility);
        }}
        onReset={() => {
          setRangeStart("");
          setRangeEnd("");
          setCity("");
          setVisibility("all");
        }}
      />

      <div className="flex gap-2 flex-wrap">
        {statusBtn("all", "전체", <FaRegCheckCircle className="opacity-70" />)}
        {statusBtn("active", "활성", <FaRegCheckCircle className="opacity-70" />)}
        {statusBtn("draft", "초안", <FaRegClock className="opacity-70" />)}
        {statusBtn("deleted", "삭제됨(휴지통)", <FaRegTimesCircle className="opacity-70" />)}
      </div>

      <div ref={tableAnchorRef} />

      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        tabIndex={0}
        role="region"
        aria-label="이벤트 테이블"
        onKeyDown={tableKeyHandler}
      >
        <div className="admin-sticky-bar">
          <div className="admin-sticky-pill" role="status" aria-live="polite">
            현재: <span className="admin-sticky-strong">{stickyLabel.s}</span> ·{" "}
            <span className="admin-sticky-strong">{stickyLabel.n}</span>건
            <span className="admin-sticky-muted">
              {mode !== "all" ? ` · ${mode === "nightlife" ? "Nightlife" : "Explorer"}` : ""}
              {q.trim() ? ` · 검색` : ""}
              {city.trim() ? ` · ${city.trim()}` : ""}
              {rangeStart || rangeEnd ? ` · 기간` : ""}
              {visibility !== "all" ? ` · ${visibility === "public" ? "공개" : "비공개"}` : ""}
            </span>

            <button
              type="button"
              className="admin-sticky-reset"
              onClick={() => {
                setMode("all");
                setStatus("all");
                setQ("");
                setSort("date_desc");
                setLimit(20);
                setPage(1);
                setRangeStart("");
                setRangeEnd("");
                setCity("");
                setVisibility("all");
                toast.success("필터를 초기화했습니다.");
              }}
            >
              필터 초기화
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">불러오는 중...</div>
        ) : filteredAll.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="조건에 맞는 이벤트가 없습니다."
              description="필터를 초기화하거나, 새 이벤트를 등록해 보세요."
              actionLabel="+ 이벤트 등록하기"
              onAction={() => (window.location.href = "/admin/events/new")}
              className="shadow-none"
            />
          </div>
        ) : (
          <>
            <table className="admin-table w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                <tr>
                  {!isTrashView ? (
                    <th className="admin-th px-4 py-4 font-semibold w-[52px]">
                      <input
                        ref={headerCbRef}
                        type="checkbox"
                        className="h-4 w-4"
                        checked={headerState.checked}
                        disabled={bulkBusy || headerState.disabled}
                        onChange={() => selection.toggleAllVisible()} // ✅ 훅 메서드명에 맞춤
                        aria-label="현재 페이지 전체 선택"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  ) : null}

                  <th className="admin-th px-6 py-4 font-semibold">구분</th>
                  <th className="admin-th px-6 py-4 font-semibold">상태</th>
                  <th className="admin-th px-6 py-4 font-semibold">이벤트</th>
                  <th className="admin-th px-6 py-4 font-semibold">날짜</th>
                  <th className="admin-th px-6 py-4 font-semibold">장소</th>
                  <th className="admin-th px-6 py-4 font-semibold text-right">관리</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paged.map((e) => {
                  const id = String((e as any)?.id || "");
                  const modeVal = (e as any).mode;

                  const rs = getRecordStatus(e);
                  const ts = getTimeStatus(e);

                  const dateLabel = formatRange((e as any).date, (e as any).endDate || (e as any).date, {
                    weekday: true,
                  });

                  const isPreviewing = previewOpen && previewEvent?.id && id === String((previewEvent as any)?.id || "");
                  const isFocus = focusId && id === focusId;

                  const checked = !isTrashView ? selection.isSelected(id) : false;
                  const editTo = `/admin/events/${id}/edit?mode=${encodeURIComponent(modeVal || "explorer")}`;

                  let badgeText = "";
                  let badgeClass = "bg-gray-100 text-gray-700";

                  if (rs === "deleted") {
                    badgeText = "삭제됨";
                    badgeClass = "bg-gray-100 text-gray-700";
                  } else if (rs === "draft") {
                    badgeText = "초안";
                    badgeClass = "bg-yellow-100 text-yellow-700";
                  } else {
                    badgeText = ts === "active" ? "오늘" : ts === "past" ? "종료" : "예정";
                    badgeClass =
                      ts === "active"
                        ? "bg-green-100 text-green-700"
                        : ts === "past"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700";
                  }

                  return (
                    <tr
                      key={id}
                      id={`event-row-${id}`}
                      className={[
                        "admin-tr hover:bg-gray-50 cursor-pointer",
                        checked ? "bg-emerald-50" : "",
                        isPreviewing ? "ring-2 ring-blue-200" : "",
                        isFocus ? "bg-yellow-50 ring-2 ring-yellow-200" : "",
                      ].join(" ")}
                      role="button"
                      tabIndex={0}
                      aria-label={`이벤트 선택: ${(e as any).title || ""}`}
                      onClick={() => openPreview(e)}
                      onFocus={() => setActiveId(id)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          openPreview(e);
                        }
                      }}
                    >
                      {!isTrashView ? (
                        <td
                          className="admin-td px-4 py-4"
                          onClick={(ev) => ev.stopPropagation()}
                          onKeyDown={(ev) => ev.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            disabled={bulkBusy || !id}
                            onChange={(ev) => selection.setChecked(id, ev.target.checked)}
                            aria-label="행 선택"
                          />
                        </td>
                      ) : null}

                      <td className="admin-td px-6 py-4">
                        <span
                          className={`admin-chip px-2 py-1 rounded text-xs font-bold ${
                            modeVal === "nightlife" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {modeVal === "nightlife" ? "Nightlife" : "Explorer"}
                        </span>
                      </td>

                      <td className="admin-td px-6 py-4">
                        <span className={`admin-chip px-2 py-1 rounded text-xs font-bold ${badgeClass}`}>{badgeText}</span>
                      </td>

                      <td className="admin-td px-6 py-4">
                        <div className="font-bold text-gray-800">{(e as any).title}</div>
                        <div className="text-xs text-gray-500 mt-1 flex gap-2 flex-wrap">
                          {(e as any).city ? <span className="admin-chip px-2 py-0.5 rounded bg-gray-100">{(e as any).city}</span> : null}
                          {(e as any).category ? (
                            <span className="admin-chip px-2 py-0.5 rounded bg-gray-100">{(e as any).category}</span>
                          ) : null}
                        </div>
                        {(e as any).description ? <div className="text-xs text-gray-500 line-clamp-1 mt-1">{(e as any).description}</div> : null}
                      </td>

                      <td className="admin-td px-6 py-4 text-sm text-gray-700">{dateLabel}</td>
                      <td className="admin-td px-6 py-4 text-sm text-gray-700">{(e as any).location}</td>

                      <td
                        className="admin-td px-6 py-4 text-right whitespace-nowrap"
                        onClick={(ev) => ev.stopPropagation()}
                        onKeyDown={(ev) => ev.stopPropagation()}
                      >
                        {isTrashView ? (
                          <button
                            type="button"
                            onClick={() => void restoreEventFromTrash(e)}
                            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-extrabold"
                          >
                            복구
                          </button>
                        ) : (
                          <EventRowActions
                            editTo={editTo}
                            onDuplicate={() => void handleDuplicate(e)}
                            onCopyLink={() => void copyAdminEditLink(e)}
                            onDelete={() => {
                              setDeleteTarget(e);
                              setDeleteText("");
                            }}
                            deleteConfirmTitle={String((e as any)?.title || "")}
                            deleteConfirmMeta={dateLabel}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={(p) => setPage(clampInt(p, 1, totalPages, 1))} />
          </>
        )}
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={closeDeleteModal}
        title="휴지통으로 이동"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
              disabled={deleting}
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold disabled:opacity-60"
              disabled={deleting || deleteText.trim() !== "DELETE"}
            >
              {deleting ? "처리 중..." : "이동"}
            </button>
          </div>
        }
      >
        {deleteTarget ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
              <div className="font-extrabold">주의</div>
              <div className="mt-1">
                이 작업은 <span className="font-extrabold">휴지통으로 이동</span>입니다. 복구는{" "}
                <span className="font-extrabold">삭제됨(휴지통) 탭</span>에서만 가능합니다.
              </div>
              <div className="mt-1 text-xs text-red-700/80">실수 방지를 위해 DELETE 입력이 필요합니다.</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
              <div className="font-extrabold text-gray-900 truncate">{(deleteTarget as any).title}</div>
              <div className="mt-1 text-xs text-gray-600">
                {(deleteTarget as any).mode === "nightlife" ? "Nightlife" : "Explorer"} ·{" "}
                {formatRange((deleteTarget as any).date, (deleteTarget as any).endDate || (deleteTarget as any).date, { weekday: true })}
              </div>
              {(deleteTarget as any).location ? <div className="mt-1 text-xs text-gray-600 truncate">{(deleteTarget as any).location}</div> : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">휴지통으로 이동하려면 DELETE 입력</label>
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-red-500 font-mono"
                autoComplete="off"
                disabled={deleting}
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => (!bulkBusy ? closeBulkDelete() : null)}
        title={`선택 ${selection.selectedCount}개 휴지통 이동`}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeBulkDelete}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
              disabled={bulkBusy}
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void confirmBulkDelete()}
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold disabled:opacity-60"
              disabled={bulkBusy || bulkDeleteText.trim() !== "DELETE"}
            >
              {bulkBusy ? "처리 중..." : "이동"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-800">
            <div className="font-extrabold">주의</div>
            <div className="mt-1">
              총 <span className="font-extrabold">{selection.selectedCount}</span>개를 휴지통으로 이동합니다. 실수 방지를 위해{" "}
              <span className="font-extrabold">DELETE</span> 입력이 필요합니다.
            </div>
            <div className="mt-1 text-xs text-red-700/80">복구는 “삭제됨(휴지통)” 탭에서만 가능합니다.</div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">휴지통으로 이동하려면 DELETE 입력</label>
            <input
              value={bulkDeleteText}
              onChange={(e) => setBulkDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-red-500 font-mono"
              autoComplete="off"
              disabled={bulkBusy}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
