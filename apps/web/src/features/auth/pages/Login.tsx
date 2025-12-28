// apps/web/src/features/auth/pages/Login.tsx

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import toast from "react-hot-toast";

import { loginUser, loginWithSocial } from "../api/auth.api";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const safeEmail = email.trim();
      await loginUser({ email: safeEmail, password });

      // ✅ zustand auth.store는 onAuthStateChanged로 자동 업데이트됨
      toast.success("로그인 성공! 환영합니다.");
      navigate("/");
    } catch (err: any) {
      console.error("로그인 실패:", err);

      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password"
      ) {
        toast.error("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (err?.code === "auth/too-many-requests") {
        toast.error("너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else if (err?.code === "auth/invalid-email") {
        toast.error("이메일 형식을 확인해주세요.");
      } else {
        toast.error("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      await loginWithSocial(provider);
      toast.success(`${provider} 계정으로 로그인되었습니다.`);
      navigate("/");
    } catch (error: any) {
      console.error(error);
      if (error?.code === "auth/popup-closed-by-user") {
        toast("로그인 창을 닫으셨습니다.", { icon: "ℹ️" });
      } else {
        toast.error(`${provider} 로그인 실패. 설정을 확인해주세요.`);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* 좌측 이미지 */}
      <div className="relative hidden w-full md:flex md:w-1/2 lg:w-3/5 bg-black">
        <img
          src="https://images.unsplash.com/photo-1504457047772-27faf1c00561?q=80&w=2000&auto=format&fit=crop"
          alt="Vietnam Travel"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="relative z-10 flex h-full flex-col justify-center px-12 text-white">
          <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight">
            Welcome Back
            <br />
            to Vietnam
          </h1>
          <p className="text-lg text-gray-200 opacity-90 max-w-md leading-relaxed">
            당신의 취향에 딱 맞는 여행과 나이트라이프.
            <br />
            다시 돌아오신 걸 환영합니다.
          </p>
        </div>
      </div>

      {/* 우측 로그인 폼 */}
      <div className="flex w-full flex-col justify-center bg-white px-8 py-12 dark:bg-gray-900 md:w-1/2 lg:w-2/5 md:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">로그인</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              계정이 없으신가요?{" "}
              <Link
                to="/register"
                className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                무료 회원가입
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  비밀번호
                </label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "로그인"}
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
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 text-sm font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FaGoogle /> Google로 로그인
            </button>
            <button
              onClick={() => handleSocialLogin("facebook")}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 text-sm font-bold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FaFacebook /> Facebook으로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
