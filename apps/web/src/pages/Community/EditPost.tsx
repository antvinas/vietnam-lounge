// apps/web/src/pages/Community/EditPost.tsx
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPostById,
  updatePost,
  getCategories,
  deletePost,
  PostFormData,
  Post,
  Category,
} from "@/api/community";
import { FaPen, FaTag, FaFileAlt, FaImage, FaTrash } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import useUiStore from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";

const EditPost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contentMode } = useUiStore();
  const { user } = useAuthStore();

  const isNightlife = contentMode === "nightlife";
  const segment = isNightlife ? "adult" : "general";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<Omit<PostFormData, "segment">>();

  // 게시글 불러오기
  const {
    data: post,
    isLoading: isLoadingPost,
    isError: isErrorPost,
  } = useQuery<Post | null>({
    queryKey: ["post", postId, segment],
    queryFn: () => (postId ? getPostById(postId, segment) : null),
    enabled: !!postId,
  });

  // 카테고리 불러오기
  const {
    data: categories,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useQuery<Category[]>({
    queryKey: ["categories", segment],
    queryFn: () => getCategories(segment),
  });

  // 상태
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestPw, setGuestPw] = useState("");

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        category: post.category,
        content: post.content,
      });
      if (post.imageUrl) {
        setImagePreviews([post.imageUrl]);
      }
    }
  }, [post, reset]);

  // 로그인 소유자 여부
  const isOwnerLoggedIn = useMemo(() => {
    if (!user || !post?.authorId) return false;
    return user.uid === post.authorId;
  }, [user, post]);

  // 삭제 버튼 노출 조건
  const showDeleteButton = isOwnerLoggedIn || !user;

  // 게시글 수정
  const {
    mutate: editPost,
    isPending: isEditing,
    isError: isEditError,
    isSuccess: isEditSuccess,
  } = useMutation({
    mutationFn: (formData: Omit<PostFormData, "segment"> & {
      guestName?: string;
      guestPw?: string;
    }) => {
      if (!postId) return Promise.reject("Post ID not found");
      return updatePost(postId, {
        ...formData,
        segment,
        guestName: !user ? guestName : undefined,
        guestPw: !user ? guestPw : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", segment] });
      queryClient.invalidateQueries({ queryKey: ["post", postId, segment] });
      navigate(`/community/post/${postId}`);
    },
  });

  // 게시글 삭제
  const {
    mutate: mutateDelete,
    isPending: isDeleting,
    isError: isDeleteError,
    isSuccess: isDeleteSuccess,
  } = useMutation({
    mutationFn: () =>
      deletePost(
        postId!,
        segment,
        !user ? guestName : undefined,
        !user ? guestPw : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", segment] });
      navigate("/community");
    },
  });

  const onSubmit = (data: Omit<PostFormData, "segment">) => {
    editPost(data);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPreviews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result as string);
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const contentValue = watch("content") || "";

  if (isLoadingPost)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        게시글 불러오는 중...
      </div>
    );
  if (isErrorPost || !post)
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        게시글을 불러올 수 없습니다.
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2">게시글 수정</h1>
        <p className="text-sm text-gray-500 mb-6">
          수정 전{" "}
          <Link
            to="/community?cat=notice"
            className="text-blue-500 hover:underline"
          >
            커뮤니티 이용 가이드
          </Link>{" "}
          를 확인해주세요.
        </p>

        {(isEditError || isDeleteError) && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            처리 중 오류가 발생했습니다. 입력값을 확인하세요.
          </div>
        )}
        {isEditSuccess && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            수정 성공! 게시글로 이동합니다...
          </div>
        )}
        {isDeleteSuccess && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            삭제 성공! 목록으로 이동합니다...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 게스트 입력 */}
          {!user && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="닉네임"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={guestPw}
                onChange={(e) => setGuestPw(e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <FaPen /> 제목
            </label>
            <input
              {...register("title", { required: "제목을 입력하세요." })}
              className="w-full border rounded px-3 py-2"
              placeholder="제목을 입력하세요"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* 카테고리 */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <FaTag /> 카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              {isLoadingCategories ? (
                <span className="text-gray-400">불러오는 중...</span>
              ) : isErrorCategories ? (
                <span className="text-red-500">카테고리를 불러올 수 없음</span>
              ) : (
                categories?.map((cat) => (
                  <label
                    key={cat.id}
                    className="cursor-pointer px-3 py-1 rounded-full border hover:bg-blue-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      value={cat.name}
                      {...register("category", {
                        required: "카테고리를 선택하세요.",
                      })}
                      className="hidden"
                      defaultChecked={post.category === cat.name}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))
              )}
            </div>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* 본문 */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <FaFileAlt /> 내용
            </label>
            <textarea
              {...register("content", {
                required: "내용을 입력하세요.",
                minLength: { value: 10, message: "10자 이상 입력하세요." },
              })}
              className="w-full border rounded px-3 py-2 min-h-[200px]"
              placeholder="내용을 입력하세요"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {contentValue.length}자
            </div>
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <FaImage /> 이미지 업로드
            </label>
            <div className="border-2 border-dashed rounded p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="imageUpload"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="imageUpload"
                className="cursor-pointer text-gray-500"
              >
                클릭하거나 여러 파일 선택
              </label>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`미리보기 ${idx + 1}`}
                    className="h-24 w-full object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-between gap-3">
            {showDeleteButton ? (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    if (!guestName.trim() || !guestPw.trim()) {
                      alert("닉네임과 비밀번호를 입력하세요.");
                      return;
                    }
                  }
                  if (confirm("정말 삭제하시겠습니까?")) {
                    mutateDelete();
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded border flex items-center gap-1 text-red-600 disabled:opacity-60"
              >
                <FaTrash /> {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded border"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isEditing}
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {isEditing ? "수정 중..." : "수정 완료"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;
