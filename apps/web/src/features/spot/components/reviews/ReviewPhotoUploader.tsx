// src/features/spot/components/reviews/ReviewPhotoUploader.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ReviewPhotoUploaderProps = {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string; // default "image/*"
  className?: string;
};

type Preview = { file: File; url: string; error?: string };

export default function ReviewPhotoUploader({
  value,
  onChange,
  maxFiles = 6,
  maxSizeMB = 8,
  accept = "image/*",
  className = "",
}: ReviewPhotoUploaderProps) {
  const [items, setItems] = useState<Preview[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const revokeAll = useCallback(() => {
    items.forEach((p) => URL.revokeObjectURL(p.url));
  }, [items]);

  useEffect(() => {
    return () => revokeAll();
  }, [revokeAll]);

  useEffect(() => {
    if (!value) return;
    const previews = value.slice(0, maxFiles).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    revokeAll();
    setItems(previews);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const remaining = Math.max(0, maxFiles - items.length);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const next: Preview[] = [];
      const currentCount = items.length;

      Array.from(files).slice(0, maxFiles - currentCount).forEach((f) => {
        const isImage = f.type.startsWith("image/");
        const tooBig = f.size > maxSizeMB * 1024 * 1024;
        next.push({
          file: f,
          url: URL.createObjectURL(f),
          error: !isImage ? "이미지 파일만 업로드 가능합니다." : tooBig ? `최대 ${maxSizeMB}MB까지 가능` : undefined,
        });
      });

      const merged = [...items, ...next].slice(0, maxFiles);
      setItems(merged);
      onChange?.(merged.filter((p) => !p.error).map((p) => p.file));
    },
    [items, maxFiles, maxSizeMB, onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const totalError = useMemo(() => items.find((p) => p.error)?.error, [items]);

  const removeAt = (idx: number) => {
    const copy = [...items];
    const [rm] = copy.splice(idx, 1);
    if (rm) URL.revokeObjectURL(rm.url);
    setItems(copy);
    onChange?.(copy.filter((p) => !p.error).map((p) => p.file));
  };

  const clearAll = () => {
    revokeAll();
    setItems([]);
    onChange?.([]);
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 p-4 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <p className="text-sm text-slate-300">
          사진을 끌어다 놓거나{" "}
          <button
            type="button"
            className="text-emerald-300 underline underline-offset-4 hover:text-emerald-200 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400 rounded"
            onClick={() => inputRef.current?.click()}
          >
            파일 선택
          </button>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          최대 {maxFiles}장, {maxSizeMB}MB 이하 이미지
        </p>
      </div>

      {items.length > 0 && (
        <div className="mt-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {items.map((p, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden ring-1 ring-slate-700">
                <img
                  src={p.url}
                  alt={`업로드 미리보기 ${i + 1}`}
                  className="h-28 w-full object-cover"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width:640px) 25vw, 33vw"
                />
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path fill="currentColor" d="M18.3 5.7a1 1 0 00-1.4-1.4L12 9.2 7.1 4.3A1 1 0 105.7 5.7L10.6 10l-4.9 4.9a1 1 0 101.4 1.4L12 11.4l4.9 4.9a1 1 0 001.4-1.4L13.4 10l4.9-4.9z"/>
                  </svg>
                </button>
                {p.error && (
                  <div className="absolute inset-0 grid place-items-center bg-black/70 px-2 text-center text-[11px] text-red-300">
                    {p.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">남은 업로드 가능: {remaining}장</span>
            <div className="flex items-center gap-2">
              {totalError && <span className="text-xs text-red-300">{totalError}</span>}
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg bg-slate-700/70 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
              >
                전체 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
