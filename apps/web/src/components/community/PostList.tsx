// apps/web/src/components/community/PostList.tsx
import { useEffect, useState } from "react";
import { getPosts, Post } from "@/api/community";
import PostCard from "./PostCard";
import { useCommunityStore } from "@/store/useCommunityStore";

export default function PostList() {
  const { category, region, sort, segment } = useCommunityStore();
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPosts = async (reset = true) => {
    setLoading(true);
    const { items: data, nextCursor } = await getPosts({
      category,
      region,
      sort,
      segment,
      limit: 20,
      cursor: reset ? null : cursor,
    });
    setItems(reset ? data : [...items, ...data]);
    setCursor(nextCursor);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, region, sort, segment]);

  return (
    <div className="space-y-4">
      {items.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <div className="flex justify-center py-4">
        {cursor ? (
          <button
            onClick={() => loadPosts(false)}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            disabled={loading}
          >
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        ) : (
          <span className="text-gray-400 text-sm">
            {items.length ? "마지막입니다" : "아직 글이 없어요"}
          </span>
        )}
      </div>
    </div>
  );
}
