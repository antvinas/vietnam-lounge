import { useQuery } from "@tanstack/react-query";
import { FaPen, FaStar, FaTrash, FaSadTear } from "react-icons/fa";
import { Link } from "react-router-dom";

// Mock Data (추후 API 연동 필요)
const fetchMyReviews = async () => {
  return new Promise<any[]>((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          spotName: "Aura Club",
          rating: 5,
          date: "2023.10.05",
          content: "음악이 정말 좋았어요! 다시 가고 싶습니다.",
          image:
            "https://images.unsplash.com/photo-1574391884720-3850ea71e834?auto=format&fit=crop&q=80&w=200",
        },
        {
          id: 2,
          spotName: "Golden Spa",
          rating: 4,
          date: "2023.09.20",
          content: "시설은 깔끔한데 예약하기가 좀 힘들었어요.",
          image: null,
        },
      ]);
    }, 500);
  });
};

const MyReviews = () => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["myReviews"],
    queryFn: fetchMyReviews,
  });

  if (isLoading) return <div className="p-10 text-center text-gray-500">리뷰를 불러오는 중입니다…</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-20">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
        <FaPen className="text-emerald-600" /> 내 리뷰
      </h2>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition"
            >
              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {review.image ? (
                  <img src={review.image} alt="review" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Img
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{review.spotName}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="text-yellow-400 flex items-center font-bold">
                        <FaStar className="mr-1" /> {review.rating}
                      </span>
                      <span>| {review.date}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition p-2">
                    <FaTrash size={14} />
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                  {review.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <FaSadTear className="text-4xl text-gray-300 mb-4 mx-auto" />
          <p className="text-gray-700 dark:text-gray-200 font-bold">작성한 리뷰가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-500">
            방문한 장소에 리뷰를 남기면 다른 사용자에게 도움이 됩니다.
          </p>
          <Link
            to="/spots"
            className="mt-5 inline-flex items-center justify-center px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
          >
            장소 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyReviews;
