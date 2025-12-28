// apps/web/src/features/auth/pages/Register.tsx

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaGoogle,
  FaFacebook,
  FaEnvelope,
  FaLock,
  FaUser,
  FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

import { registerUser, loginWithSocial } from "../api/auth.api";

type FormValues = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("redirectTo") || "/";
  }, [location.search]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const password = watch("password");

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (data.password !== data.passwordConfirm) {
        toast.error("비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      await registerUser({
        email: data.email.trim(),
        password: data.password,
        displayName: data.name,
      });

      // ✅ zustand auth.store는 onAuthStateChanged로 자동 업데이트됨
      toast.success(`환영합니다, ${data.name}님! 🎉`);
      navigate(redirectTo);
    } catch (error: any) {
      console.error(error);
      if (error?.code === "auth/email-already-in-use") {
        toast.error("이미 사용 중인 이메일입니다.");
      } else if (error?.code === "auth/weak-password") {
        toast.error("비밀번호는 6자 이상이어야 합니다.");
      } else if (error?.code === "auth/invalid-email") {
        toast.error("이메일 형식을 확인해주세요.");
      } else {
        toast.error("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      await loginWithSocial(provider);
      toast.success(`${provider} 계정으로 가입/로그인되었습니다.`);
      navigate(redirectTo);
    } catch (error: any) {
      console.error(error);
      if (error?.code === "auth/popup-closed-by-user") {
        toast("로그인 창을 닫으셨습니다.", { icon: "ℹ️" });
      } else {
        toast.error(`${provider} 가입/로그인 실패. 설정을 확인해주세요.`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">회원가입</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            로그인
          </Link>
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="홍길동"
                {...register("name", { required: "이름을 입력해주세요." })}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="name@example.com"
                {...register("email", { required: "이메일을 입력해주세요." })}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="••••••••"
                {...register("password", { required: "비밀번호를 입력해주세요.", minLength: 6 })}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">비밀번호는 6자 이상이어야 합니다.</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호 확인</label>
            <div className="relative">
              <FaCheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="••••••••"
                {...register("passwordConfirm", {
                  required: "비밀번호 확인을 입력해주세요.",
                  validate: (v) => v === password || "비밀번호가 일치하지 않습니다.",
                })}
              />
            </div>
            {errors.passwordConfirm && (
              <p className="mt-1 text-xs text-red-500">{errors.passwordConfirm.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin("google")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 text-sm font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <FaGoogle /> Google로 가입/로그인
          </button>
          <button
            onClick={() => handleSocialLogin("facebook")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 text-sm font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <FaFacebook /> Facebook으로 가입/로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
