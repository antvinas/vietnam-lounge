import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaHeart, FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getMyFavorites, removeFavorite, FavoriteSpot } from "../api/user.api";

const MyFavorites = () => {
  const queryClient = useQueryClient();

  // 목록 조회
  const { data: items, isLoading, isError } = useQuery<FavoriteSpot[]>({
    queryKey: ["favoriteSpots"],
    queryFn: getMyFavorites,
  });

  // ✅ 삭제 기능 (Mutation)
  const deleteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      // 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["favoriteSpots"] });
      toast.success("관심 장소에서 삭제되었습니다.");
    },
    onError: () => {
      toast.error("삭제에 실패했습니다.");
    }
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // ✅ 링크 이동 방지 (삭제만 수행)
    e.stopPropagation();
    if (window.confirm("관심 장소에서 삭제하시겠습니까?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading favorites...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">목록을 불러오지 못했습니다.</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FaHeart className="text-pink-500" /> 관심 장소
      </h2>

      {items && items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((it) => (
            // ✅ [수정] 카드 전체를 Link로 감싸서 상세 이동 (Mode에 따라 경로 분기)
            <Link 
              key={it.id} 
              to={it.mode === 'nightlife' ? `/adult/spots/${it.id}` : `/spots/${it.id}`}
              className="flex bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group"
            >
               {it.image && (
                 <div className="w-28 h-full bg-gray-200 overflow-hidden">
                   <img src={it.image} alt={it.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 </div>
               )}
               <div className="p-4 flex-1 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                   <div>
                     <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        it.mode === 'nightlife' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                     }`}>
                        {it.category}
                     </span>
                     <h3 className="font-bold text-gray-900 dark:text-white mt-1 leading-tight">{it.name}</h3>
                   </div>
                   
                   {/* ✅ [수정] 삭제 버튼 (하트) */}
                   <button 
                     onClick={(e) => handleDelete(e, it.id)}
                     className="text-pink-500 hover:text-gray-400 transition-colors p-1"
                     title="삭제하기"
                   >
                     <FaHeart />
                   </button>
                 </div>
                 
                 <div className="flex items-center text-xs text-gray-500 mt-3">
                   <FaMapMarkerAlt className="mr-1" /> {it.address}
                 </div>
               </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <FaExclamationTriangle className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">찜한 장소가 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">마음에 드는 곳을 찾아보세요!</p>
        </div>
      )}
    </div>
  );
};

export default MyFavorites;