import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReviewsBySpotId,
  addReviewToSpot,
  uploadReviewPhoto,
} from "@/api/spots.api";
import type { Review } from "@/types/spot";
import {
  FaStar,
  FaRegStar,
  FaUserCircle,
  FaCamera,
  FaPaperPlane,
} from "react-icons/fa";

interface ReviewSectionProps {
  spotId: string;
  reviews?: Review[];
}

type SortOption = "latest" | "rating" | "photo";

const ReviewSection = ({ spotId, reviews }: ReviewSectionProps) => {
  const queryClient = useQueryClient();
  const { data: fetchedReviews } = useQuery<Review[]>({
    queryKey: ["reviews", spotId],
    queryFn: () => fetchReviewsBySpotId(spotId),
    enabled: !reviews,
  });

  const allReviews = reviews || fetchedReviews || [];
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [expandedReviewIds, setExpandedReviewIds] = useState<string[]>([]);

  // 새 리뷰 작성 상태
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 사진 업로드 상태
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedReviewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 리뷰 작성
  const addReviewMutation = useMutation(
    (newReview: Partial<Review>) => addReviewToSpot(spotId, newReview),
    {
      onMutate: async (newReview) => {
        setSubmitting(true);
        await queryClient.cancelQueries(["reviews", spotId]);
        const prevData = queryClient.getQueryData<Review[]>([
          "reviews",
          spotId,
        ]);
        queryClient.setQueryData<Review[]>(["reviews", spotId], (old = []) => [
          {
            id: "temp-" + Date.now(),
            author: newReview.author || "익명",
            rating: newReview.rating || 0,
            comment: newReview.comment || "",
            photos: newReview.photos || [],
            timestamp: new Date().toISOString(),
            avatar: "",
          } as Review,
          ...old,
        ]);
        return { prevData };
      },
      onError: (_err, _newReview, context) => {
        if (context?.prevData) {
          queryClient.setQueryData(["reviews", spotId], context.prevData);
        }
        alert("리뷰 등록에 실패했습니다. 다시 시도해주세요.");
      },
      onSettled: () => {
        queryClient.invalidateQueries(["reviews", spotId]);
        setSubmitting(false);
      },
    }
  );

  // 사진 업로드
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadReviewPhoto(spotId, file);
        uploaded.push(res.url);
      }
      setUploadedPhotoUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      alert("사진 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === "") {
      alert("평점과 코멘트를 입력해주세요!");
      return;
    }
    addReviewMutation.mutate({
      author: author || "익명",
      rating,
      comment,
      photos: uploadedPhotoUrls,
    });
    setAuthor("");
    setRating(0);
    setComment("");
    setUploadedPhotoUrls([]);
    alert("리뷰가 등록되었습니다!");
  };

  const sortedReviews = [...allReviews].sort((a, b) => {
    switch (sortOption) {
      case "rating":
        return b.rating - a.rating;
      case "photo":
        return (b.photos?.length || 0) - (a.photos?.length || 0);
      case "latest":
      default:
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }
  });

  return (
    <section className="mt-10" aria-labelledby="reviews-heading">
      {/* 작성 폼 */}
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

          {/* 별점 선택 */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) =>
              i < rating ? (
                <FaStar
                  key={i}
                  className="h-6 w-6 cursor-pointer text-yellow-400"
                  onClick={() => setRating(i + 1)}
                />
              ) : (
                <FaRegStar
                  key={i}
                  className="h-6 w-6 cursor-pointer text-gray-300 hover:text-yellow-400"
                  onClick={() => setRating(i + 1)}
                />
              )
            )}
          </div>

          {/* 코멘트 */}
          <textarea
            placeholder="리뷰를 작성해주세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-24 w-full resize-none rounded-lg border border-border px-3 py-2 text-sm"
          />

          {/* 사진 업로드 */}
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary">
              <FaCamera /> 사진 업로드
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files)}
              />
            </label>
            {uploading && (
              <p className="mt-1 text-xs text-text-secondary">업로드 중...</p>
            )}
            {uploadedPhotoUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedPhotoUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="업로드된 리뷰 사진"
                    className="h-20 w-20 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </div>

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

      {/* 리뷰 목록 */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 id="reviews-heading" className="text-2xl font-bold text-text-main">
          리뷰{" "}
          <span className="ml-1 text-lg font-medium text-text-secondary">
            ({allReviews.length})
          </span>
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => setSortOption("latest")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              sortOption === "latest"
                ? "bg-primary text-white"
                : "bg-background-sub text-text-secondary hover:bg-background"
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortOption("rating")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              sortOption === "rating"
                ? "bg-primary text-white"
                : "bg-background-sub text-text-secondary hover:bg-background"
            }`}
          >
            평점순
          </button>
          <button
            onClick={() => setSortOption("photo")}
            className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium ${
              sortOption === "photo"
                ? "bg-primary text-white"
                : "bg-background-sub text-text-secondary hover:bg-background"
            }`}
          >
            <FaCamera /> 사진 리뷰
          </button>
        </div>
      </div>

      {sortedReviews.length === 0 ? (
        <p className="text-sm text-text-secondary">아직 등록된 리뷰가 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {sortedReviews.map((review) => {
            const isExpanded = expandedReviewIds.includes(review.id);
            const commentTooLong = review.comment.length > 200;

            return (
              <article
                key={review.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {review.avatar ? (
                    <img
                      src={review.avatar}
                      alt={`${review.author} 프로필`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="h-10 w-10 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-text-main">
                      {review.author}
                    </p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) =>
                        i < review.rating ? (
                          <FaStar key={i} className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <FaRegStar key={i} className="h-4 w-4 text-gray-300" />
                        )
                      )}
                      {review.timestamp && (
                        <span className="ml-2 text-xs text-text-secondary">
                          {new Date(review.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {commentTooLong && !isExpanded ? (
                    <>
                      <p className="line-clamp-3">{review.comment}</p>
                      <button
                        onClick={() => toggleExpand(review.id)}
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        더보기
                      </button>
                    </>
                  ) : (
                    <>
                      <p>{review.comment}</p>
                      {commentTooLong && (
                        <button
                          onClick={() => toggleExpand(review.id)}
                          className="mt-2 text-sm font-medium text-primary hover:underline"
                        >
                          접기
                        </button>
                      )}
                    </>
                  )}
                </div>

                {review.photos && review.photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {review.photos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt="리뷰 사진"
                        className="h-24 w-full rounded-md object-cover transition-transform duration-200 hover:scale-105"
                      />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReviewSection;
