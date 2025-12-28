// apps/web/src/components/common/ImageSorter.tsx
import React, { useMemo } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import Image from "@/components/common/Image";

export type ImageSorterItem =
  | string
  | {
      url: string;
      caption?: string;
      [k: string]: any;
    };

type Props = {
  /** string[] 또는 {url,...}[] 모두 허용 */
  images: ImageSorterItem[];

  /** legacy */
  onChange?: (next: ImageSorterItem[]) => void;

  /** admin/spot 쪽에서 쓰는 alias */
  onReorder?: (next: ImageSorterItem[]) => void;

  /** 삭제를 상위에서 직접 처리(예: blob revoke 등)해야 할 때 */
  onRemove?: (index: number) => void;

  variant?: "compact" | "admin";
  allowCover?: boolean;
  disabled?: boolean;

  emptyText?: string;
};

function getUrl(it: ImageSorterItem): string {
  return typeof it === "string" ? String(it || "") : String(it?.url || "");
}

function commit(props: Props, next: ImageSorterItem[]) {
  (props.onChange || props.onReorder)?.(next);
}

function SortableTile({
  id,
  url,
  index,
  isCover,
  variant,
  disabled,
  allowCover,
  onSetCover,
  onRemove,
}: {
  id: string;
  url: string;
  index: number;
  isCover: boolean;
  variant: "compact" | "admin";
  disabled: boolean;
  allowCover: boolean;
  onSetCover: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const tileCls =
    variant === "admin"
      ? "relative overflow-hidden rounded-xl border bg-white shadow-sm"
      : "relative overflow-hidden rounded-md border bg-white";

  const imgWrapCls =
    variant === "admin"
      ? "relative aspect-square w-full bg-gray-50"
      : "relative h-24 w-24 bg-gray-50";

  const btnBase =
    "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-extrabold whitespace-nowrap";

  return (
    <div ref={setNodeRef} style={style} className={tileCls}>
      {/* top badges */}
      <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
        {allowCover && isCover && (
          <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-extrabold text-white">
            대표
          </span>
        )}
        {variant === "admin" && (
          <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-gray-700">
            #{index + 1}
          </span>
        )}
      </div>

      {/* drag handle */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
        <button
          type="button"
          className={[
            btnBase,
            "bg-black/60 text-white hover:bg-black/70",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
          ].join(" ")}
          title={disabled ? "비활성화" : "드래그로 순서 변경"}
          {...attributes}
          {...listeners}
          disabled={disabled}
        >
          ⠿
        </button>
      </div>

      <div className={imgWrapCls}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="원본 열기"
          className="absolute inset-0"
        >
          <Image
            src={url}
            alt="img"
            className="h-full w-full object-cover"
            markFallback
          />
        </a>

        {/* hover actions */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 transition hover:opacity-100" />
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between gap-2 opacity-0 transition hover:opacity-100">
          <div className="pointer-events-auto flex items-center gap-2">
            {allowCover && !isCover && (
              <button
                type="button"
                className={[btnBase, "bg-white text-gray-900 hover:bg-gray-100"].join(" ")}
                onClick={onSetCover}
                disabled={disabled}
                title="이 이미지를 대표로 설정"
              >
                대표로
              </button>
            )}
            <button
              type="button"
              className={[btnBase, "bg-white text-red-700 hover:bg-red-50"].join(" ")}
              onClick={onRemove}
              disabled={disabled}
              title="삭제"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageSorter({
  images,
  onChange,
  onReorder,
  onRemove,
  variant = "admin",
  allowCover = false,
  disabled = false,
  emptyText = "이미지가 없습니다.",
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const items = useMemo(() => {
    const filtered = (images || []).filter((x) => !!getUrl(x));
    return filtered;
  }, [images]);

  const ids = useMemo(() => items.map((it) => getUrl(it)), [items]);

  const doCommit = (next: ImageSorterItem[]) => {
    (onChange || onReorder)?.(next);
  };

  const handleRemove = (index: number) => {
    if (onRemove) return onRemove(index);
    const next = items.filter((_, i) => i !== index);
    doCommit(next);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    doCommit(arrayMove(items, oldIndex, newIndex));
  };

  if (!items.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        {emptyText}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={ids}>
        <div className={variant === "admin" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-wrap gap-2"}>
          {items.map((it, idx) => {
            const url = getUrl(it);
            const id = url;
            const isCover = allowCover && idx === 0;

            return (
              <SortableTile
                key={`${id}-${idx}`}
                id={id}
                url={url}
                index={idx}
                isCover={isCover}
                variant={variant}
                disabled={disabled}
                allowCover={allowCover}
                onSetCover={() => doCommit(arrayMove(items, idx, 0))}
                onRemove={() => handleRemove(idx)}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
