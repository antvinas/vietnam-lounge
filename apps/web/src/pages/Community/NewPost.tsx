import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPost,
  getCategories,
  deletePost,
  PostFormData,
  Category,
} from "@/api/community";
import { FaPen, FaTag, FaFileAlt, FaImage, FaTrash } from "react-icons/fa";
import { useState } from "react";
import useUiStore from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";

const NewPost: React.FC = () => {
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
    watch,
  } = useForm<Omit<PostFormData, "segment">>();

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["categories", segment],
    queryFn: () => getCategories(segment),
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestPw, setGuestPw] = useState("");

  // 글 등록
  const { mutate: submitPost, isPending, isError, isSuccess } = useMutation({
    mutationFn: (data: PostFormData & { guestName?: string; guestPw?: string }) =>
      createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", segment] });
      navigate("/community");
    },
  });

  const onSubmit = (data: Omit<PostFormData, "segment">) => {
    submitPost({
      ...data,
      segment,
      guestName: !user ? guestName : undefined,
      guestPw: !user ? guestPw : undefined,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          newPreviews.push(reader.result as string);
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const contentValue = watch("content") || "";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2">새 글 작성</h1>
        <p className="text-sm text-gray-500 mb-6">
          글 작성 전{" "}
          <Link to="/community?cat=notice" className="text-blue-500 hover:underline">
            커뮤니티 이용 가이드
          </Link>{" "}
          를 확인해주세요.
        </p>

        {isError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            등록 실패. 다시 시도해주세요.
          </div>
        )}
        {isSuccess && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            등록 성공! 목록으로 이동합니다...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* 카테고리 */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <FaTag /> 카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              {isLoadingCategories ? (
                <span className="text-gray-400">불러오는 중...</span>
              ) : (
                categories?.map((cat) => (
                  <label key={cat.id} className="cursor-pointer px-3 py-1 rounded-full border">
                    <input type="radio" value={cat.name} {...register("category", { required: true })} className="hidden" />
                    <span>{cat.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 본문 */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <FaFileAlt /> 내용
            </label>
            <textarea
              {...register("content", { required: true, minLength: 10 })}
              className="w-full border rounded px-3 py-2 min-h-[200px]"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{contentValue.length}자</div>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <FaImage /> 이미지 업로드
            </label>
            <div className="border-2 border-dashed rounded p-4 text-center">
              <input type="file" accept="image/*" multiple className="hidden" id="imageUpload" onChange={handleImageUpload} />
              <label htmlFor="imageUpload" className="cursor-pointer text-gray-500">
                클릭하거나 여러 파일 업로드
              </label>
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                  <img key={idx} src={src} alt={`preview-${idx}`} className="h-24 w-full object-cover rounded border" />
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded border">
              취소
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 rounded bg-blue-500 text-white">
              {isPending ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPost;
