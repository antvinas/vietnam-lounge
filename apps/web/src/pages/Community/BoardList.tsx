// apps/web/src/pages/Community/BoardList.tsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCommunityStore } from "@/store/useCommunityStore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getPosts, Post } from "@/api/community";
import useUiStore from "@/store/ui.store";
import CategoryTabs from "@/components/community/CategoryTabs";
import FiltersBar from "@/components/community/FiltersBar";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import { parseISO, format, isValid } from "date-fns";

const BoardList = () => {
  const { category, sort, setCategory, setSort } = useCommunityStore();
  const [params] = useSearchParams();
  const { contentMode } = useUiStore();
  const isNightlife = contentMode === "nightlife";
  const segment = isNightlife ? "adult" : "general";

  const [viewMode, setViewMode] = useState<"list" | "album">("list");

  // URL 파라미터 동기화 (region 제거됨)
  useEffect(() => {
    const cat = params.get("cat");
    const srt = params.get("sort");
    if (cat) setCategory(cat);
    if (srt) setSort(srt);
  }, [params, setCategory, setSort]);

  // 무한 스크롤 데이터 로딩
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<{
    items: Post[];
    nextCursor: string | null;
  }>({
    queryKey: ["posts", category, sort, segment],
    queryFn: ({ pageParam }) =>
      getPosts({ category, sort, segment, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    initialPageParam: null,
  });

  const loaderRef = useInfiniteScroll({
    enabled: hasNextPage,
    onLoadMore: fetchNextPage,
  });

  if (isLoading) return <div className="p-8 text-center">불러오는 중...</div>;
  if (isError)
    return (
      <div className="p-8 text-center text-red-500">
        게시글을 불러오지 못했습니다.
      </div>
    );

  // 게시글 구분
  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  const noticePosts = posts.filter((p) => p.isNotice);
  const normalPosts = posts.filter((p) => !p.isNotice && !p.isPinned);

  // 작성일 포맷
  const formatDate = (dateValue: any) => {
    try {
      let dateObj: Date;
      if (typeof dateValue === "string") {
        dateObj = parseISO(dateValue);
      } else if (typeof dateValue === "object" && "seconds" in dateValue) {
        dateObj = new Date(dateValue.seconds * 1000);
      } else {
        dateObj = new Date(dateValue);
      }
      if (isValid(dateObj)) {
        return format(dateObj, "yyyy.MM.dd HH:mm");
      }
      return "-";
    } catch {
      return "-";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">라운지 커뮤니티</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded ${
              viewMode === "list"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            목록형
          </button>
          <button
            onClick={() => setViewMode("album")}
            className={`px-3 py-1 rounded ${
              viewMode === "album"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            앨범형
          </button>
        </div>
      </div>

      {/* 카테고리 + 필터 */}
      <CategoryTabs />
      <FiltersBar />

      {/* 목록형 */}
      {viewMode === "list" && (
        <div className="mt-6">
          <table className="w-full border-t border-gray-300 text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2 text-center w-1/12">구분</th>
                <th className="p-2 text-center">제목</th>
                <th className="p-2 text-center w-1/6">작성자</th>
                <th className="p-2 text-center w-1/6">작성일</th>
                <th className="p-2 text-center w-1/12">조회수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* 공지 */}
              {noticePosts.map((p) => (
                <tr key={p.id} className="bg-red-50">
                  <td className="p-2 text-center">
                    <span className="px-2 py-1 border border-red-400 text-red-600 rounded">
                      공지
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <Link
                      to={`/community/post/${p.id}`}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="p-2 text-center">{p.authorName ?? "운영자"}</td>
                  <td className="p-2 text-center">{formatDate(p.createdAt)}</td>
                  <td className="p-2 text-center">{p.viewCount ?? 0}</td>
                </tr>
              ))}

              {/* 일반 글 */}
              {normalPosts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-2 text-center text-gray-600">
                    {p.category ?? "-"}
                  </td>
                  <td className="p-2 text-center">
                    <Link
                      to={`/community/post/${p.id}`}
                      className="hover:underline"
                    >
                      {p.title}
                      {p.commentsCount > 0 && (
                        <span className="text-red-500 ml-1">
                          [{p.commentsCount}]
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="p-2 text-center">{p.authorName ?? "익명"}</td>
                  <td className="p-2 text-center">{formatDate(p.createdAt)}</td>
                  <td className="p-2 text-center">{p.viewCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 앨범형 */}
      {viewMode === "album" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {normalPosts.map((p) => (
            <Link
              key={p.id}
              to={`/community/post/${p.id}`}
              className="border rounded-lg overflow-hidden hover:shadow"
            >
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {p.thumbnailUrl ? (
                  <img
                    src={p.thumbnailUrl}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No Image</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium line-clamp-2">{p.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {p.content}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 무한 스크롤 로더 */}
      <div ref={loaderRef} className="h-10 flex justify-center items-center">
        {isFetchingNextPage && <span>불러오는 중...</span>}
        {!hasNextPage && (
          <span className="text-gray-400">마지막 글입니다.</span>
        )}
      </div>
    </div>
  );
};

export default BoardList;
