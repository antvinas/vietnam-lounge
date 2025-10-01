// apps/web/src/components/community/PostTable.tsx
import { Link } from "react-router-dom";
import { Post } from "@/api/community";
import { parseISO, format, isValid, isToday } from "date-fns";
import { FaRegImage } from "react-icons/fa";

export default function PostTable({ posts }: { posts: Post[] }) {
  return (
    <>
      {posts.map((post) => {
        const isNotice = post.isNotice;
        const isPinned = post.isPinned && !isNotice;

        // 작성일 처리
        let createdTime = "-";
        if (post.createdAt) {
          try {
            let dateObj: Date;
            if (typeof post.createdAt === "string") {
              dateObj = parseISO(post.createdAt);
            } else if (
              typeof post.createdAt === "object" &&
              "seconds" in post.createdAt
            ) {
              dateObj = new Date((post.createdAt as any).seconds * 1000);
            } else {
              dateObj = new Date(post.createdAt as any);
            }
            if (isValid(dateObj)) {
              createdTime = isToday(dateObj)
                ? format(dateObj, "HH:mm")
                : format(dateObj, "MM-dd");
            }
          } catch {
            createdTime = "-";
          }
        }

        return (
          <tr
            key={post.id}
            className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
              isNotice ? "bg-red-50 dark:bg-red-900/20" : ""
            }`}
          >
            {/* 제목 + 카테고리 */}
            <td className="p-2">
              <div className="flex items-center gap-2">
                {isNotice ? (
                  <span className="text-red-600 font-bold text-xs">[공지]</span>
                ) : isPinned ? (
                  <span className="text-amber-600 font-semibold text-xs">
                    [필독]
                  </span>
                ) : post.category ? (
                  <span className="text-gray-600 text-xs">[{post.category}]</span>
                ) : null}

                <Link
                  to={`/community/post/${post.id}`}
                  className="hover:underline font-medium truncate max-w-[400px] flex items-center gap-1"
                >
                  {post.thumbnailUrl && (
                    <FaRegImage className="text-gray-400 w-4 h-4 shrink-0" />
                  )}
                  <span>{post.title}</span>
                </Link>

                {post.commentsCount > 0 && (
                  <span className="text-red-500 ml-1">
                    [{post.commentsCount}]
                  </span>
                )}
              </div>
            </td>

            <td className="p-2 text-center">{post.authorName ?? "익명"}</td>
            <td className="p-2 text-center whitespace-nowrap">{createdTime}</td>
            <td className="p-2 text-center whitespace-nowrap">
              {post.viewCount ?? post.views ?? 0}
            </td>
            <td className="p-2 text-center whitespace-nowrap">
              {post.commentsCount ?? 0}
            </td>
          </tr>
        );
      })}
    </>
  );
}
