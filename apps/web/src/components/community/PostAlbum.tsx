import { Link } from "react-router-dom";
import { Post } from "@/api/community";

export default function PostAlbum({ posts }: { posts: Post[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {posts.map((post) => {
        const isNotice = post.isNotice;
        const isPinned = post.isPinned && !isNotice;

        return (
          <Link
            key={post.id}
            to={`/community/post/${post.id}`}
            className="rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition bg-white dark:bg-gray-800 flex flex-col"
          >
            {/* 썸네일 */}
            <div className="h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {post.thumbnailUrl ? (
                <img
                  src={post.thumbnailUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">📄 이미지 없음</span>
              )}
            </div>

            {/* 본문 */}
            <div className="p-3 flex flex-col flex-grow">
              {/* 라벨 */}
              <div className="mb-1 text-xs flex gap-1">
                {isNotice ? (
                  <span className="text-red-600 font-bold">[공지]</span>
                ) : isPinned ? (
                  <span className="text-amber-600 font-semibold">[필독]</span>
                ) : post.category ? (
                  <span className="text-gray-600">[{post.category}]</span>
                ) : null}
              </div>

              {/* 제목 */}
              <h3 className="line-clamp-2 text-sm font-medium mb-1">
                {post.title}
              </h3>

              {/* 요약 */}
              <p className="line-clamp-2 text-xs text-gray-500 flex-grow">
                {post.content}
              </p>

              {/* 메타 */}
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{post.authorName ?? "익명"}</span>
                <div className="flex gap-2">
                  <span>{post.views ?? 0} 조회</span>
                  <span>{post.commentsCount ?? 0} 댓글</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
