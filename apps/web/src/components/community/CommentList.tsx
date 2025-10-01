// apps/web/src/components/community/CommunityList.tsx
import { useEffect, useState } from "react";
import { createComment, getCommentsByPostId } from "@/api/community";
import { Comment } from "@/api/community";
import { FaUserCircle, FaFlag, FaThumbsUp, FaPaperPlane } from "react-icons/fa";

export default function CommentList({
  postId,
  segment,
}: {
  postId: string;
  segment: "general" | "adult";
}) {
  const [items, setItems] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getCommentsByPostId(postId, segment);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [postId, segment]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    await createComment(postId, text, segment);
    setText("");
    await load();
    setSubmitting(false);
  };

  return (
    <div className="mt-8">
      <h4 className="font-semibold mb-4">댓글 {items.length}</h4>

      {/* 댓글 작성창 */}
      <div className="sticky top-0 z-10 mb-6 flex items-center gap-2 bg-white dark:bg-gray-800 py-2">
        <FaUserCircle className="text-gray-400 w-8 h-8" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="댓글을 입력하세요"
          disabled={submitting}
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition"
        >
          {submitting ? "등록 중..." : <FaPaperPlane />}
        </button>
      </div>

      {/* 댓글 리스트 */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400">댓글 불러오는 중...</div>
        ) : items.length ? (
          items.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-700/40 shadow-sm"
            >
              <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                <div className="flex items-center gap-2">
                  <FaUserCircle className="text-gray-400 w-5 h-5" />
                  <span className="font-medium">{c.author ?? "익명"}</span>
                  {c.createdAt && (
                    <span className="text-gray-400">
                      {new Date(
                        typeof c.createdAt === "string"
                          ? c.createdAt
                          : (c.createdAt as any).seconds * 1000
                      ).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-1 hover:text-blue-500 transition">
                    <FaThumbsUp /> {c.likeCount ?? 0}
                  </button>
                  <button className="flex items-center gap-1 hover:text-red-500 transition">
                    <FaFlag /> 신고
                  </button>
                </div>
              </div>
              <div className="ml-7 text-sm text-gray-700 dark:text-gray-200">
                {c.content}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded border p-6 text-center text-sm text-gray-400 bg-gray-50 dark:bg-gray-700/30">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
          </div>
        )}
      </div>
    </div>
  );
}
