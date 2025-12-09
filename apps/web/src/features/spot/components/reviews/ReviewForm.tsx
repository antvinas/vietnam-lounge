// src/features/spot/components/reviews/ReviewForm.tsx

import React, { useMemo, useState } from "react";
import ReviewPhotoUploader from "@/features/spot/components/reviews/ReviewPhotoUploader";

export type NewReview = {
  rating: number;        // 1~5
  content: string;       // 10~3000자
  photos?: File[];
  nickname?: string;
};

type Props = {
  spotId: string;
  onSubmit: (data: NewReview) => Promise<void> | void;
  submitting?: boolean;
  className?: string;
};

export default function ReviewForm({ spotId, onSubmit, submitting = false, className = "" }: Props) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(() => {
    if (rating < 1 || rating > 5) return false;
    const len = content.trim().length;
    return len >= 10 && len <= 3000;
  }, [rating, content]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError("별점과 리뷰 내용을 확인하세요. 내용은 10자 이상이어야 합니다.");
      return;
    }
    setError(null);
    await onSubmit({ rating, content: content.trim(), photos: files, nickname: nickname.trim() || undefined });
    setContent("");
    setFiles([]);
  };

  return (
    <form onSubmit={submit} className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`}>
      <h3 className="mb-3 text-base font-semibold text-slate-100">리뷰 남기기</h3>

      <div className="mb-3">
        <label className="block text-sm text-slate-300 mb-1">별점</label>
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n}점`}
              className={`h-7 w-7 rounded-full grid place-items-center ${
                n <= rating ? "bg-emerald-500/30 text-emerald-200" : "bg-slate-700 text-slate-400"
              }`}
            >
              ★
            </button>
          ))}
          <span className="text-sm text-slate-400">{rating}점</span>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm text-slate-300 mb-1">내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={3000}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="방문 경험을 구체적으로 작성해 주세요. (최소 10자)"
          required
        />
        <div className="mt-1 text-xs text-slate-500">{content.length} / 3000</div>
      </div>

      <div className="mb-3">
        <label className="block text-sm text-slate-300 mb-1">닉네임(선택)</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={30}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="공개 표시 이름"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-2">사진 첨부(선택)</label>
        <ReviewPhotoUploader value={files} onChange={setFiles} maxFiles={6} maxSizeMB={8} />
      </div>

      {error && <div className="mb-2 text-sm text-red-300">{error}</div>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="reset"
          onClick={() => { setContent(""); setFiles([]); setRating(5); setNickname(""); }}
          className="rounded-xl bg-slate-700/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
          disabled={submitting}
        >
          초기화
        </button>
        <button
          type="submit"
          disabled={!valid || submitting}
          className="rounded-xl bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
        >
          {submitting ? "등록 중…" : "리뷰 등록"}
        </button>
      </div>
    </form>
  );
}
