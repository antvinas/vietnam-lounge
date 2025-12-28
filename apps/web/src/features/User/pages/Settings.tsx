import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { FiCamera, FiSave, FiTrash2, FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { getMyProfile, updateMyProfile, withdrawUser } from "../api/user.api";
import type { UserProfile } from "../api/user.api";
import { useAuthStore } from "@/features/auth/stores/auth.store";

type FormData = { nickname: string; bio: string };

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { logout, user, authReady } = useAuthStore();
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ["myProfile", user?.uid],
    queryFn: getMyProfile,
    enabled: authReady && !!user?.uid,
    retry: 0,
  });

  useEffect(() => {
    if (profile) {
      setValue("nickname", profile.nickname ?? "");
      setValue("bio", profile.bio || "");
      setPreview((profile as any).avatar || null);
    }
  }, [profile, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => await updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      toast.success("변경사항이 저장되었습니다.");
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const withdrawMutation = useMutation({
    mutationFn: withdrawUser,
    onSuccess: async () => {
      await logout();
      toast.success("탈퇴가 완료되었습니다.");
      navigate("/", { replace: true });
    },
    onError: () => toast.error("탈퇴에 실패했습니다."),
  });

  const onSubmit = (data: FormData) => updateMutation.mutate(data);

  const confirmWithdraw = () => {
    const ok = window.confirm("정말 탈퇴하시겠습니까?\n탈퇴 시 계정 정보가 삭제되며 복구할 수 없습니다.");
    if (ok) withdrawMutation.mutate();
  };

  if (!authReady) {
    return <div className="p-10 text-center text-gray-500">인증 정보를 확인 중입니다…</div>;
  }

  if (!user) {
    return <div className="p-10 text-center text-gray-500">로그인 후 이용 가능합니다.</div>;
  }

  if (isLoading) {
    return <div className="p-10 text-center text-gray-500">정보를 불러오는 중입니다…</div>;
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-red-500">
        사용자 정보를 불러오지 못했습니다. (로그인 상태/백엔드 연결을 확인해주세요)
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">설정 및 보안</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
              {preview ? (
                <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FiUser size={40} />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full cursor-pointer hover:bg-primary">
              <FiCamera size={16} />
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">닉네임</label>
            <input
              {...register("nickname", { required: true })}
              className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800"
            />
            {errors.nickname && <p className="text-xs text-red-500 mt-1">닉네임을 입력해 주세요.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              value={profile?.email ?? user.email ?? ""}
              disabled
              className="w-full px-4 py-2 rounded-xl border bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">자기소개</label>
            <textarea
              {...register("bio")}
              className="w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 min-h-[100px]"
              placeholder="간단한 소개를 입력해 주세요."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 flex justify-center gap-2"
        >
          <FiSave /> {updateMutation.isPending ? "저장 중…" : "변경사항 저장"}
        </button>
      </form>

      <hr className="my-10 border-gray-200 dark:border-gray-700" />

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-red-500">계정 관리</h3>

        <button
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
          className="w-full py-3 border text-gray-600 font-medium rounded-xl hover:bg-gray-50 flex justify-center gap-2"
        >
          <FiLogOut /> 로그아웃
        </button>

        <button
          onClick={confirmWithdraw}
          className="w-full py-3 border border-red-100 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 flex justify-center gap-2"
        >
          <FiTrash2 /> 회원 탈퇴
        </button>
      </div>
    </div>
  );
};

export default Settings;
