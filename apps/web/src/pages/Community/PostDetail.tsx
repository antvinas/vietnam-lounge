import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPostById,
  getCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
  updatePostLike,
  increaseViewCount,
  deletePost,
  Post,
  Comment,
} from "@/api/community";
import {
  FaUserCircle,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaPaperPlane,
  FaReply,
  FaFlag,
  FaImage,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { parseISO, format, isValid, isToday } from "date-fns";
import { useAuthStore } from "@/store/auth.store";
import useUiStore from "@/store/ui.store";

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { contentMode } = useUiStore();
  const segment = contentMode === "nightlife" ? "adult" : "general";

  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPw, setGuestPw] = useState("");

  // 삭제용 입력 (게시글/댓글 공용)
  const [deleteGuestName, setDeleteGuestName] = useState("");
  const [deleteGuestPw, setDeleteGuestPw] = useState("");

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editGuestName, setEditGuestName] = useState("");
  const [editGuestPw, setEditGuestPw] = useState("");

  // 게시글 데이터
  const { data: post, isLoading, isError } = useQuery<Post | null>({
    queryKey: ["post", postId, segment],
    queryFn: () => (postId ? getPostById(postId, segment) : null),
    enabled: !!postId,
  });

  // 댓글 데이터
  const { data: comments } = useQuery<Comment[]>({
    queryKey: ["comments", postId, segment],
    queryFn: () => (postId ? getCommentsByPostId(postId, segment) : []),
    enabled: !!postId,
  });

  // 조회수 증가
  useEffect(() => {
    if (postId) {
      increaseViewCount(postId, segment).then(() => {
        queryClient.invalidateQueries({ queryKey: ["post", postId, segment] });
      });
    }
  }, [postId, segment, queryClient]);

  // 댓글 작성
  const addCommentMutation = useMutation({
    mutationFn: ({
      content,
      guestName,
      guestPw,
    }: {
      content: string;
      guestName?: string;
      guestPw?: string;
    }) =>
      createComment(postId!, content, segment, undefined, guestName, guestPw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId, segment] });
      setNewComment("");
      setGuestName("");
      setGuestPw("");
    },
  });

  // 댓글 수정
  const editCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
      guestName,
      guestPw,
    }: {
      commentId: string;
      content: string;
      guestName?: string;
      guestPw?: string;
    }) =>
      updateComment(postId!, commentId, segment, content, guestName, guestPw),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId, segment] });
      setEditingCommentId(null);
      setEditContent("");
      setEditGuestName("");
      setEditGuestPw("");
    },
  });

  // 댓글 삭제
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      deleteComment(
        postId!,
        commentId,
        segment,
        !user ? deleteGuestName : undefined,
        !user ? deleteGuestPw : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId, segment] });
    },
  });

  // 게시글 좋아요
  const toggleLikeMutation = useMutation({
    mutationFn: () => updatePostLike(postId!, segment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId, segment] });
    },
  });

  // 게시글 삭제
  const deletePostMutation = useMutation({
    mutationFn: () =>
      deletePost(
        postId!,
        segment,
        !user ? deleteGuestName : undefined,
        !user ? deleteGuestPw : undefined
      ),
    onSuccess: () => {
      navigate("/community");
    },
  });

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
        return isToday(dateObj)
          ? format(dateObj, "HH:mm")
          : format(dateObj, "yyyy.MM.dd HH:mm");
      }
      return "-";
    } catch {
      return "-";
    }
  };

  if (isLoading)
    return <div className="py-10 text-center">게시글 불러오는 중...</div>;
  if (isError || !post)
    return (
      <div className="py-10 text-center text-red-500">
        게시글을 찾을 수 없습니다.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 제목 */}
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>

      {/* 작성자 / 작성일 / 조회 */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <FaUserCircle className="w-6 h-6 text-gray-400" />
        <span className="font-semibold">{post.authorName ?? "익명"}</span>
        <span>{formatDate(post.createdAt)}</span>
        <span>조회 {post.viewCount ?? 0}</span>
      </div>

      {/* 본문 */}
      <div className="prose dark:prose-invert max-w-none mb-6">
        <p>{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="본문 이미지" className="rounded-lg mt-4" />
        )}
      </div>

      {/* 액션바 */}
      <div className="flex gap-6 border-t border-b py-3 mb-6 text-gray-600 text-sm">
        <button
          onClick={() => toggleLikeMutation.mutate()}
          className="flex items-center gap-1 hover:text-red-500"
        >
          {post.likes > 0 ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
          좋아요 {post.likes ?? 0}
        </button>
        <div className="flex items-center gap-1">
          <FaComment /> 댓글 {post.commentsCount ?? 0}
        </div>
        <button
          onClick={() => {
            if (user) {
              deletePostMutation.mutate();
            } else {
              if (!deleteGuestName || !deleteGuestPw) {
                alert("닉네임과 비밀번호를 입력하세요.");
                return;
              }
              deletePostMutation.mutate();
            }
          }}
          className="flex items-center gap-1 hover:text-red-600 ml-auto"
        >
          <FaTrash /> 삭제
        </button>
      </div>

      {/* 게스트용 삭제 입력 */}
      {!user && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="닉네임"
            value={deleteGuestName}
            onChange={(e) => setDeleteGuestName(e.target.value)}
            className="border rounded px-2 py-1 text-sm flex-1"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={deleteGuestPw}
            onChange={(e) => setDeleteGuestPw(e.target.value)}
            className="border rounded px-2 py-1 text-sm flex-1"
          />
        </div>
      )}

      {/* 댓글 영역 */}
      <section>
        <h2 className="font-bold mb-4">댓글</h2>
        <div className="space-y-4">
          {comments && comments.length ? (
            comments.map((c) => (
              <div key={c.id} className="border-b pb-2">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                  <div className="flex items-center gap-2">
                    <FaUserCircle className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold">{c.author ?? "익명"}</span>
                    {c.createdAt && (
                      <span className="text-xs">{formatDate(c.createdAt)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCommentId(c.id);
                        setEditContent(c.content);
                      }}
                      className="flex items-center gap-1 text-xs hover:text-blue-600"
                    >
                      <FaEdit /> 수정
                    </button>
                    <button
                      onClick={() => {
                        if (user) {
                          deleteCommentMutation.mutate(c.id);
                        } else {
                          if (!deleteGuestName || !deleteGuestPw) {
                            alert("닉네임과 비밀번호를 입력하세요.");
                            return;
                          }
                          deleteCommentMutation.mutate(c.id);
                        }
                      }}
                      className="flex items-center gap-1 text-xs hover:text-red-600"
                    >
                      <FaTrash /> 삭제
                    </button>
                  </div>
                </div>

                {/* 수정 모드 */}
                {editingCommentId === c.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!editContent.trim()) return;
                      editCommentMutation.mutate({
                        commentId: c.id,
                        content: editContent,
                        guestName: !user ? editGuestName : undefined,
                        guestPw: !user ? editGuestPw : undefined,
                      });
                    }}
                    className="mt-2"
                  >
                    {!user && (
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="닉네임"
                          value={editGuestName}
                          onChange={(e) => setEditGuestName(e.target.value)}
                          className="border rounded px-2 py-1 text-sm flex-1"
                        />
                        <input
                          type="password"
                          placeholder="비밀번호"
                          value={editGuestPw}
                          onChange={(e) => setEditGuestPw(e.target.value)}
                          className="border rounded px-2 py-1 text-sm flex-1"
                        />
                      </div>
                    )}
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-gray-800 dark:text-gray-200 mb-1">
                    {c.content}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400">아직 댓글이 없습니다.</p>
          )}
        </div>
      </section>

      {/* 댓글 작성 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newComment.trim()) {
            addCommentMutation.mutate({
              content: newComment,
              guestName: !user ? guestName : undefined,
              guestPw: !user ? guestPw : undefined,
            });
          }
        }}
        className="mt-6 border rounded-lg p-3"
      >
        {!user && (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="닉네임"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-1"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={guestPw}
              onChange={(e) => setGuestPw(e.target.value)}
              className="border rounded px-2 py-1 text-sm flex-1"
            />
          </div>
        )}

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="w-full border-0 focus:ring-0 resize-none text-sm"
          rows={3}
        />

        <div className="flex items-center justify-end mt-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 text-sm"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostDetail;
