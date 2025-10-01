import { useQuery } from "@tanstack/react-query";
import { fetchReviewsBySpotId } from "@/api/spots.api";
import type { Review } from "@/types/spot";
import { FaStar, FaEllipsisV } from "react-icons/fa";

interface ReviewSectionProps {
  spotId: string;
  reviews?: Review[];
}

const ReviewSection = ({ spotId, reviews }: ReviewSectionProps) => {
  // 외부에서 reviews 주입 가능, 없으면 쿼리로 가져오기
  const { data: fetchedReviews } = useQuery<Review[]>({
    queryKey: ["reviews", spotId],
    queryFn: () => fetchReviewsBySpotId(spotId),
    enabled: !reviews,
  });

  const allReviews = reviews || fetchedReviews || [];

  if (allReviews.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        아직 등록된 리뷰가 없습니다.
      </p>
    );
  }

  return (
    <section className="mt-8">
      <h3 className="mb-6 text-2xl font-bold text-text-main">리뷰</h3>

      <div className="space-y-6">
        {allReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            {/* Header: Author + Rating + Menu */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={review.avatar}
                  alt={review.author}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="font-semibold text-text-main">
                    {review.author}
                  </p>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {review.timestamp && (
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {new Date(review.timestamp).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button className="text-gray-400 transition-colors hover:text-gray-600">
                <FaEllipsisV />
              </button>
            </div>

            {/* Body: Comment */}
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {review.comment}
            </p>

            {/* Photos */}
            {review.photos && review.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {review.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt="리뷰 사진"
                    className="h-20 w-20 rounded-md object-cover transition-transform duration-200 hover:scale-105"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewSection;
