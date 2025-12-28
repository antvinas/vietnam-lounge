// apps/web/src/features/spot/components/ReviewSection.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as SpotApi from "@/api/spot";
import type { SpotReview } from "@/types/spot";
import { FaStar, FaRegStar, FaUserCircle, FaPaperPlane } from "react-icons/fa";

interface Props {
  spotId: string;
  mode?: "explorer" | "nightlife";
}

type SortOption = "latest" | "rating";

async function apiFetchReviews(mode: "explorer" | "nightlife", spotId: string): Promise<SpotReview[]> {
  const mod: any = SpotApi as any;
  const fn = mod.getSpotReviews || mod.fetchSpotReviews || mod.fetchReviews;
  if (!fn) return [];

  try {
    const res = await fn(spotId, mode);
    return Array.isArray(res) ? res : [];
  } catch {
    try {
      const res = await fn(mode, spotId);
      return Array.isArray(res) ? res : [];
    } catch {
      const res = await fn(spotId);
      return Array.isArray(res) ? res : [];
    }
  }
}

async function apiAddReview(mode: "explorer" | "nightlife", spotId: string, review: Omit<SpotReview, "createdAt">) {
  const mod: any = SpotApi as any;
  const fn = mod.addReviewToSpot || mod.createSpotReview || mod.addSpotReview;
  if (!fn) throw new Error("Spot API: addReviewToSpot not found");

  try {
    return await fn(spotId, review, mode);
  } catch {
    try {
      return await fn(mode, spotId, review);
    } catch {
      return await fn(spotId, review);
    }
  }
}

export default function ReviewSection({ spotId, mode = "explorer" }: Props) {
  const qc = useQueryClient();

  const { data: reviews = [] } = useQuery<SpotReview[]>({
    queryKey: ["reviews", spotId, mode],
    queryFn: () => apiFetchReviews(mode, spotId),
    enabled: !!spotId,
  });

  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [submitting, setSubmitting] = useState(false);

  const addReviewMutation = useMutation({
    mutationFn: (newReview: Omit<SpotReview, "createdAt">) => apiAddReview(mode, spotId, newReview),
    onMutate: async (newReview) => {
      setSubmitting(true);
      await qc.cancelQueries({ queryKey: ["reviews", spotId, mode] });

      const prev = qc.getQueryData<SpotReview[]>(["reviews", spotId, mode]) || [];
      qc.setQueryData<SpotReview[]>(
        ["reviews", spotId, mode],
        [{ ...(newReview as any), createdAt: new Date() } as any, ...prev]
      );
      return { prev };
    },
    onError: (_e, _n, ctx) => {
      if (ctx?.prev) qc.setQueryData(["reviews", spotId, mode], ctx.prev);
      alert("리뷰 등록 실패");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["reviews", spotId, mode] });
      setSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || comment.trim() === "") {
      alert("평점과 코멘트를 입력해주세요.");
      return;
    }
    addReviewMutation.mutate({
      userId: "anonymous",
      displayName: author || "익명",
      rating,
      comment,
    } as any);

    setAuthor("");
    setRating(0);
    setComment("");
  };

  const sorted = [...reviews].sort((a: any, b: any) => {
    if (sortOption === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    const aSec = a.createdAt?.seconds ?? (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
    const bSec = b.createdAt?.seconds ?? (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
    return bSec - aSec;
  });

  return (
    <section className="mt-10" aria-labelledby="reviews-heading">
      <div className="mb-10 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-text-main">리뷰 작성</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="닉네임 (선택, 미입력시 익명)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />

          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) =>
              i < rating ? (
                <FaStar key={i} className="h-6 w-6 cursor-pointer text-yellow-400" onClick={() => setRating(i + 1)} />
              ) : (
                <FaRegStar
                  key={i}
                  className="h-6 w-6 cursor-pointer text-gray-300 hover:text-yellow-400"
                  onClick={() => setRating(i + 1)}
                />
              )
            )}
          </div>

          <textarea
            placeholder="리뷰를 작성해주세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-24 w-full resize-none rounded-lg border border-border px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            <FaPaperPlane />
            {submitting ? "작성 중..." : "등록하기"}
          </button>
        </form>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 id="reviews-heading" className="text-2xl font-bold text-text-main">
          리뷰 <span className="ml-1 text-lg font-medium text-text-secondary">({reviews.length})</span>
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => setSortOption("latest")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              sortOption === "latest" ? "bg-primary text-white" : "bg-background-sub text-text-secondary hover:bg-background"
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortOption("rating")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              sortOption === "rating" ? "bg-primary text-white" : "bg-background-sub text-text-secondary hover:bg-background"
            }`}
          >
            평점순
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-text-secondary">아직 등록된 리뷰가 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {sorted.map((r: any, idx: number) => (
            <article key={idx} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <FaUserCircle className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="font-semibold text-text-main">{r.displayName ?? r.userName ?? "익명"}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) =>
                      i < (r.rating ?? 0) ? (
                        <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <FaRegStar key={i} className="h-4 w-4 text-gray-300" />
                      )
                    )}
                    {r.createdAt && (
                      <span className="ml-2 text-xs text-text-secondary">
                        {new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm leading-relaxed text-text-secondary">{r.comment ?? r.content ?? ""}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
