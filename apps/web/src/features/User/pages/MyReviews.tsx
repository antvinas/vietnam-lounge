import { useQuery } from "@tanstack/react-query";
import { FaPen, FaStar, FaTrash, FaSadTear } from "react-icons/fa";
import { Link } from "react-router-dom";

// ✅ Mock Data (이미지 URL을 안전한 Unsplash 링크로 교체)
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
          // 깨진 URL 수정됨
          image: "https://images.unsplash.com/photo-1574391884720-3850ea71e834?auto=format&fit=crop&q=80&w=200" 
        },
        { 
          id: 2, 
          spotName: "Golden Spa", 
          rating: 4, 
          date: "2023.09.20", 
          content: "시설은 깔끔한데 예약하기가 좀 힘들었어요.", 
          image: null 
        },
      ]);
    }, 500);
  });
};

const MyReviews = () => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["myReviews"],
    queryFn: fetchMyReviews,
  });

  if (isLoading) return <div className="p-10 text-center">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaPen className="text-green-500" /> 내가 쓴 리뷰
        </h2>
        <span className="text-sm text-gray-500">총 {reviews?.length || 0}개</span>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex gap-4">
              {/* 이미지 */}
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {review.image ? (
                  <img src={review.image} alt="review" className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">No Img</div>
                )}
              </div>
              
              {/* 내용 */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{review.spotName}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <span className="text-yellow-400 flex items-center"><FaStar /> {review.rating}</span>
                      <span>• {review.date}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition-colors" title="삭제">
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
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <FaSadTear className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500">아직 작성한 리뷰가 없습니다.</p>
          <Link to="/spots" className="mt-4 px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-bold">
            리뷰 쓰러 가기
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyReviews;