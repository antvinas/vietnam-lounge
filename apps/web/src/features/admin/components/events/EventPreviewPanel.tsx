// apps/web/src/features/admin/components/events/EventPreviewPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaTimes, FaExternalLinkAlt, FaCopy, FaExternalLinkSquareAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";

import Image from "@/components/common/Image";
import { formatRange, parseYmdLocal, toDateMaybe } from "@/features/admin/utils/datetime";
import type { AdminEventData } from "@/features/admin/api/admin.api";
import EventAuditTrail from "@/features/admin/components/events/EventAuditTrail";

type AuditLine = {
  at: string; // 표시용 문자열(예: 2025-12-26 10:15)
  actor?: string; // optional
  action: string; // 예: "수정: title, date"
};

type Props = {
  open: boolean;
  event: AdminEventData | null;
  editTo?: string;

  onClose: () => void;

  onCopyLink?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;

  /** ✅ (선택) 상위에서 미리 가공한 최근 변경이력 5줄 */
  auditLines?: AuditLine[];
};

function getStatus(e: AdminEventData): "upcoming" | "active" | "past" {
  const start = parseYmdLocal(e.date);
  const end = parseYmdLocal(e.endDate || e.date);
  if (!start) return "upcoming";

  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e0 = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : s;

  if (t0.getTime() < s.getTime()) return "upcoming";
  if (t0.getTime() > e0.getTime()) return "past";
  return "active";
}

function getVisibilityFlag(e: AdminEventData): boolean | undefined {
  const v = (e as any)?.isPublic;
  if (typeof v === "boolean") return v;

  const vv = (e as any)?.visibility;
  if (vv === "public") return true;
  if (vv === "private") return false;

  return undefined;
}

function uniq(arr: string[]) {
  const set = new Set<string>();
  arr.forEach((x) => {
    const v = String(x || "").trim();
    if (v) set.add(v);
  });
  return Array.from(set);
}

function pickImageUrls(e: AdminEventData): string[] {
  const out: string[] = [];

  const singleCandidates = [
    (e as any)?.thumbnail,
    (e as any)?.thumbnailUrl,
    (e as any)?.cover,
    (e as any)?.coverUrl,
    (e as any)?.coverImage,
    (e as any)?.coverImageUrl,
    (e as any)?.image,
    (e as any)?.imageUrl,
    (e as any)?.banner,
    (e as any)?.bannerUrl,
  ];

  singleCandidates.forEach((v) => {
    if (typeof v === "string") out.push(v);
  });

  const arrayCandidates = [
    (e as any)?.images,
    (e as any)?.imageUrls,
    (e as any)?.gallery,
    (e as any)?.photos,
    (e as any)?.photoUrls,
    (e as any)?.media,
  ];

  arrayCandidates.forEach((arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((v) => {
        if (typeof v === "string") out.push(v);
        else if (v && typeof v === "object") {
          const u = (v as any)?.url ?? (v as any)?.src;
          if (typeof u === "string") out.push(u);
        }
      });
    }
  });

  return uniq(out);
}

export default function EventPreviewPanel({
  open,
  event,
  editTo,
  onClose,
  onCopyLink,
  onDuplicate,
  onDelete,
  auditLines,
}: Props) {
  // ESC 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const status = useMemo(() => (event ? getStatus(event) : "upcoming"), [event]);
  const visibility = useMemo(() => (event ? getVisibilityFlag(event) : undefined), [event]);
  const imageUrls = useMemo(() => (event ? pickImageUrls(event) : []), [event]);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setActiveImage(imageUrls[0] ?? null);
  }, [open, imageUrls]);

  const updatedAtText = useMemo(() => {
    if (!event) return "";
    const u = toDateMaybe((event as any)?.updatedAt) || toDateMaybe((event as any)?.createdAt);
    return u ? new Date(u).toLocaleString() : "";
  }, [event]);

  const dateText = useMemo(() => {
    if (!event) return "";
    return formatRange(event.date, event.endDate || event.date, { weekday: true });
  }, [event]);

  const modeLabel = useMemo(() => {
    if (!event) return "-";
    return event.mode === "nightlife" ? "나이트라이프" : "탐험";
  }, [event]);

  const desc = useMemo(() => String((event as any)?.description || ""), [event]);
  const descTrim = desc.trim();
  const longDesc = descTrim.length > 220;
  const [descOpen, setDescOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    setDescOpen(false);
  }, [open, event?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <aside
        className="absolute right-0 top-0 h-full w-full sm:w-[540px] bg-white shadow-2xl border-l border-gray-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="이벤트 미리보기"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* ✅ 요약 바(상태/모드/공개/기간) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border",
                    status === "active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : status === "past"
                        ? "bg-gray-50 text-gray-700 border-gray-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200",
                  ].join(" ")}
                >
                  {status === "active" ? "진행중" : status === "past" ? "종료" : "예정"}
                </span>

                <span
                  className={[
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border",
                    event?.mode === "nightlife"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-blue-50 text-blue-700 border-blue-200",
                  ].join(" ")}
                >
                  {modeLabel}
                </span>

                {visibility != null ? (
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border",
                      visibility ? "bg-slate-900 text-white border-slate-900" : "bg-white text-gray-700 border-gray-200",
                    ].join(" ")}
                  >
                    {visibility ? "공개" : "비공개"}
                  </span>
                ) : null}

                {dateText ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold border bg-white text-gray-700 border-gray-200">
                    {dateText}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 text-lg font-extrabold text-gray-900 truncate">
                {event?.title || "(제목 없음)"}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 hover:bg-gray-100 text-gray-600"
              aria-label="닫기"
            >
              <FaTimes />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {editTo ? (
              <Link
                to={editTo}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-black text-white px-3 py-2 text-sm font-extrabold"
              >
                편집 열기 <FaExternalLinkAlt className="text-xs" />
              </Link>
            ) : null}

            {onCopyLink ? (
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 text-sm font-extrabold"
              >
                링크 복사 <FaCopy className="text-xs" />
              </button>
            ) : null}

            {onDuplicate ? (
              <button
                type="button"
                onClick={onDuplicate}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 px-3 py-2 text-sm font-extrabold"
              >
                복제
              </button>
            ) : null}

            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 px-3 py-2 text-sm font-extrabold"
              >
                삭제
              </button>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
          {/* ✅ 대표 이미지 + 썸네일 strip */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-extrabold text-gray-900">이미지</div>
              {activeImage ? (
                <a
                  href={activeImage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900"
                  title="원본 이미지 열기"
                >
                  원본 열기 <FaExternalLinkSquareAlt />
                </a>
              ) : null}
            </div>

            {imageUrls.length ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  <div className="aspect-[16/9] w-full">
                    <Image src={activeImage || imageUrls[0]} alt={event?.title || "event"} className="w-full h-full" />
                  </div>
                </div>

                {imageUrls.length > 1 ? (
                  <div className="flex gap-2 overflow-auto pb-1">
                    {imageUrls.slice(0, 12).map((url) => {
                      const isActive = (activeImage || imageUrls[0]) === url;
                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setActiveImage(url)}
                          className={[
                            "shrink-0 w-20 h-14 rounded-xl overflow-hidden border bg-gray-50",
                            isActive ? "border-slate-900 ring-2 ring-slate-900/10" : "border-gray-200",
                          ].join(" ")}
                          title="썸네일 선택"
                        >
                          <Image src={url} alt="thumb" className="w-full h-full" />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-gray-50 p-4">
                등록된 이미지가 없습니다.
              </div>
            )}
          </section>

          {/* Meta */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-extrabold text-gray-900 mb-3">정보</div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">도시</span>
                <span className="font-bold text-gray-900">{String((event as any)?.city || "-")}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">카테고리</span>
                <span className="font-bold text-gray-900">{String((event as any)?.category || "-")}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">장소</span>
                <span className="font-bold text-gray-900 text-right">{String((event as any)?.location || "-")}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">업데이트</span>
                <span className="font-bold text-gray-900">{updatedAtText || "-"}</span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-xs text-gray-700 break-all text-right">
                  {String((event as any)?.id || "-")}
                </span>
              </div>
            </div>
          </section>

          {/* ✅ Recent Audit */}
          <section>
            {Array.isArray(auditLines) && auditLines.length ? (
              <>
                <div className="text-sm font-extrabold text-gray-900 mb-2">최근 변경이력</div>
                <div className="rounded-2xl border border-gray-200 bg-white p-3 space-y-2">
                  {auditLines.slice(0, 5).map((x, idx) => (
                    <div key={`${x.at}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">{x.action}</div>
                        {x.actor ? <div className="text-xs text-gray-500">by {x.actor}</div> : null}
                      </div>
                      <div className="text-xs text-gray-500 shrink-0">{x.at}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : event?.id ? (
              <EventAuditTrail eventId={String(event.id)} compact limit={5} />
            ) : (
              <div className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-gray-50 p-4">
                변경이력을 표시할 이벤트 ID가 없습니다.
              </div>
            )}
          </section>

          {/* ✅ Description: 접기/펼치기 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-extrabold text-gray-900">설명</div>
              {longDesc ? (
                <button
                  type="button"
                  onClick={() => setDescOpen((v) => !v)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900"
                >
                  {descOpen ? (
                    <>
                      접기 <FaChevronUp />
                    </>
                  ) : (
                    <>
                      펼치기 <FaChevronDown />
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {descTrim ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div
                  className={[
                    "text-sm text-gray-700 whitespace-pre-wrap leading-relaxed",
                    longDesc && !descOpen ? "line-clamp-5" : "",
                  ].join(" ")}
                >
                  {desc}
                </div>
                {longDesc && !descOpen ? (
                  <div className="mt-2 text-xs text-gray-500">길이가 길어 일부만 표시 중</div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-gray-500 rounded-xl border border-gray-200 bg-gray-50 p-4">
                설명이 없습니다.
              </div>
            )}
          </section>
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
          Tip: 행 선택 후 ↑/↓ 이동, Enter로 열기, ESC로 닫기
        </div>
      </aside>
    </div>
  );
}
