/* @file apps/web/src/components/plan/NoteEditor.tsx */
import React, { useEffect, useId, useMemo, useState } from "react";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteValue {
  id?: string;
  title: string;
  contentHtml: string;
  checklist: ChecklistItem[];
  images: string[];
  tags?: string[];
  linkedPlaceTitle?: string | null;
}

interface Props {
  value?: NoteValue;
  onChange?: (v: NoteValue) => void;
  onClose?: () => void;
  onSave?: (v: NoteValue) => void;
  onUploadImage?: (file: File) => Promise<string>;
  className?: string;
  autoFocusTitle?: boolean;
}

function newNote(): NoteValue {
  return { title: "", contentHtml: "", checklist: [], images: [] };
}

const btn =
  "rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800";

export default function NoteEditor({
  value,
  onChange,
  onClose,
  onSave,
  onUploadImage,
  className,
  autoFocusTitle,
}: Props) {
  const [note, setNote] = useState<NoteValue>(value ?? newNote());
  const id = useId();

  useEffect(() => {
    if (!value) return;
    setNote(value);
  }, [value]);

  function patch(partial: Partial<NoteValue>, opts?: { autosave?: boolean }) {
    const next = { ...note, ...partial };
    setNote(next);
    onChange?.(next);
    if (opts?.autosave) onSave?.(next);
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (!isSave) return;
      e.preventDefault();
      onSave?.(note);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [note, onSave]);

  function addChecklistItem() {
    const it = { id: crypto.randomUUID(), text: "", done: false };
    patch({ checklist: [...note.checklist, it] }, { autosave: true });
  }

  function syncHtml() {
    const el = document.getElementById(`${id}-content`) as HTMLDivElement | null;
    if (el) patch({ contentHtml: el.innerHTML }, { autosave: true });
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    let url: string;
    if (onUploadImage) url = await onUploadImage(file);
    else url = URL.createObjectURL(file);
    patch({ images: [...note.images, url] }, { autosave: true });
    e.currentTarget.value = "";
  }

  const progress = useMemo(() => {
    const total = note.checklist.length || 0;
    const done = note.checklist.filter((x) => x.done).length;
    return { total, done, text: total ? `${done}/${total}` : "0/0" };
  }, [note.checklist]);

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <input
          autoFocus={autoFocusTitle}
          value={note.title}
          onChange={(e) => patch({ title: e.target.value })}
          onBlur={() => onSave?.(note)}
          placeholder="메모 제목"
          className="w-full rounded-2xl border px-4 py-2 bg-white dark:bg-slate-900 text-base font-medium"
          aria-label="메모 제목"
        />
        <button className={btn} onClick={() => onSave?.(note)} aria-label="저장">
          저장
        </button>
        <button className={btn} onClick={onClose} aria-label="닫기">
          닫기
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          체크 {progress.text}
        </span>
        {note.linkedPlaceTitle && (
          <span className="rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-300">
            장소 연결: {note.linkedPlaceTitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className={btn}
          onClick={() => {
            document.execCommand("bold");
            syncHtml();
          }}
          aria-label="굵게"
        >
          B
        </button>
        <button
          className={btn}
          onClick={() => {
            document.execCommand("italic");
            syncHtml();
          }}
          aria-label="기울임"
        >
          I
        </button>
        <button
          className={btn}
          onClick={() => {
            document.execCommand("insertUnorderedList");
            syncHtml();
          }}
          aria-label="불릿리스트"
        >
          • List
        </button>
        <label className={`${btn} cursor-pointer`} aria-label="이미지 추가">
          이미지
          <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        </label>
      </div>

      <div
        id={`${id}-content`}
        contentEditable
        suppressContentEditableWarning
        onInput={syncHtml}
        onBlur={() => onSave?.(note)}
        className="min-h-[160px] rounded-2xl border px-4 py-3 bg-white dark:bg-slate-900 prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: note.contentHtml || "" }}
        aria-label="메모 내용"
      />

      <div className="mt-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">체크리스트</div>
          <button className={btn} onClick={addChecklistItem} aria-label="항목 추가">
            항목 추가
          </button>
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {note.checklist.map((it, idx) => (
            <div key={it.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={it.done}
                onChange={(e) => {
                  const next = [...note.checklist];
                  next[idx] = { ...it, done: e.target.checked };
                  patch({ checklist: next }, { autosave: true });
                }}
                aria-label="완료"
              />
              <input
                value={it.text}
                onChange={(e) => {
                  const next = [...note.checklist];
                  next[idx] = { ...it, text: e.target.value };
                  patch({ checklist: next }, { autosave: true });
                }}
                onBlur={() => onSave?.(note)}
                placeholder="할 일"
                className="flex-1 rounded-xl border px-3 py-1.5 bg-white dark:bg-slate-900 text-sm"
                aria-label="항목 내용"
              />
              <button
                className={btn}
                onClick={() => {
                  const next = note.checklist.filter((x) => x.id !== it.id);
                  patch({ checklist: next }, { autosave: true });
                }}
                aria-label="항목 삭제"
              >
                삭제
              </button>
            </div>
          ))}
          {note.checklist.length === 0 && (
            <div className="text-xs text-slate-500">아직 항목이 없습니다.</div>
          )}
        </div>
      </div>

      {note.images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {note.images.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt={`note-img-${i}`}
                className="h-24 w-full object-cover rounded-xl border"
              />
              <button
                className="absolute right-1 top-1 rounded-lg bg-white/80 px-2 py-0.5 text-xs"
                onClick={() => {
                  const next = note.images.filter((_, idx) => idx !== i);
                  patch({ images: next }, { autosave: true });
                }}
                aria-label="이미지 제거"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
