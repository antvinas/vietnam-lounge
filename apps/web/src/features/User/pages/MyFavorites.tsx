import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { FaHeart, FaMapMarkerAlt, FaExclamationTriangle, FaRegLightbulb } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getMyFavorites, removeFavorite, FavoriteSpot } from "../api/user.api";
import Loading from "@/components/common/Loading";

const getRegionByAddress = (address: string, regionField?: string): string => {
  if (regionField && ["북부", "중부", "남부"].includes(regionField)) return regionField;
  const addr = (address || "").toLowerCase();
  if (addr.includes("hanoi") || addr.includes("하노이") || addr.includes("sapa")) return "북부";
  if (addr.includes("danang") || addr.includes("다낭") || addr.includes("hoi an")) return "중부";
  if (addr.includes("ho chi minh") || addr.includes("호치민") || addr.includes("phu quoc")) return "남부";
  return "기타";
};

const MyFavorites = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ALL" | "북부" | "중부" | "남부">("ALL");

  const { data: items = [], isLoading, isError } = useQuery<FavoriteSpot[]>({
    queryKey: ["favoriteSpots"],
    queryFn: getMyFavorites,
  });

  const deleteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favoriteSpots"] });
      toast.success("삭제되었습니다.");
    },
    onError: () => toast.error("삭제 실패"),
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("삭제하시겠습니까?")) deleteMutation.mutate(id);
  };

  const tasteAnalysis = useMemo(() => {
    if (items.length === 0) return null;
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.category || "기타";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const topCategory = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
    return { category: topCategory, count: counts[topCategory], total: items.length };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeTab === "ALL") return items;
    return items.filter(
      (item) => (item.region || getRegionByAddress(item.address || "", item.region)) === activeTab
    );
  }, [items, activeTab]);

  if (isLoading)
    return (
      <div className="h-96 flex items-center justify-center">
        <Loading />
      </div>
    );
  if (isError) return <div className="py-20 text-center text-gray-500">관심 장소를 불러오지 못했습니다.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">관심 장소</h1>

        {tasteAnalysis ? (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-800/30 flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-full text-purple-600">
              <FaRegLightbulb size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                내가 많이 저장한 카테고리: <span className="text-purple-700">'{tasteAnalysis.category}'</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                저장한 {tasteAnalysis.total}개 중 {tasteAnalysis.count}개가 {tasteAnalysis.category}입니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
            <p className="text-gray-700 dark:text-gray-200 font-bold">저장한 장소가 없습니다.</p>
            <p className="mt-1 text-sm text-gray-500">추천 장소를 둘러보고 관심으로 저장해 보세요.</p>
            <Link
              to="/spots"
              className="mt-5 inline-flex items-center justify-center px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
            >
              추천 장소 보러가기
            </Link>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          {["ALL", "북부", "중부", "남부"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                activeTab === tab
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              {tab === "ALL" ? "전체" : tab}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((it) => (
            <Link
              key={it.id}
              to={it.mode === "nightlife" ? `/adult/spots/${it.id}` : `/spots/${it.id}`}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="aspect-[4/3] bg-gray-200 relative">
                <img
                  src={it.thumbnail || "/placeholders/spot.jpg"}
                  alt={it.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <button
                  onClick={(e) => handleDelete(e, it.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-red-500 shadow-sm hover:bg-red-50"
                >
                  <FaHeart size={14} />
                </button>
                <span
                  className={`absolute top-3 left-3 px-2 py-1 text-[10px] font-bold rounded-md backdrop-blur-md text-white ${
                    it.mode === "nightlife" ? "bg-purple-600/80" : "bg-emerald-600/80"
                  }`}
                >
                  {it.mode === "nightlife" ? "NIGHT" : "DAY"}
                </span>
              </div>
              <div className="p-4">
                <span className="text-xs font-bold text-primary mb-1 block">{it.category}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{it.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-2 gap-1">
                  <FaMapMarkerAlt size={12} /> <span className="truncate">{it.address}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50 dark:bg-gray-800/50">
          <FaExclamationTriangle className="mx-auto text-3xl text-gray-300 mb-2" />
          <p className="text-gray-700 dark:text-gray-200 font-bold">저장한 장소가 없습니다.</p>
          <p className="mt-1 text-sm text-gray-500">마음에 드는 장소를 관심으로 저장해 보세요.</p>
          <Link
            to="/spots"
            className="mt-5 inline-flex items-center justify-center px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
          >
            추천 장소 보러가기
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyFavorites;
