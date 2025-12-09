import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaFacebook, FaEnvelope, FaLock, FaUser, FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";

// ✅ 실제 API 연결
import { registerUser, loginWithSocial, RegisterParams } from "../api/auth.api";
import { useAuthStore } from "../stores/auth.store";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterParams & { passwordConfirm: string }>();

  const password = watch("password");

  // 1. 이메일 회원가입 처리
  const onSubmit = async (data: RegisterParams) => {
    setIsLoading(true);
    try {
      const response = await registerUser(data);
      login(response.user);
      toast.success(`환영합니다, ${response.user.displayName}님! 🎉`);
      navigate("/");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("이미 사용 중인 이메일입니다.");
      } else if (error.code === 'auth/weak-password') {
        toast.error("비밀번호는 6자 이상이어야 합니다.");
      } else {
        toast.error("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. SNS 로그인 처리
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const response = await loginWithSocial(provider);
      login(response.user);
      toast.success("소셜 로그인 성공!");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(`${provider} 로그인 실패. 다시 시도해주세요.`);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      
      {/* Left: Branding Image */}
      <div className="hidden lg:flex w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=1600')" }}>
        <div className="absolute inset-0 bg-purple-900/60 mix-blend-multiply" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-6">
            <span className="bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Premium Membership
            </span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Join the <br /> Lounge Club
          </h1>
          <p className="text-lg text-gray-200 mb-8 leading-relaxed">
            회원만의 특별한 할인 혜택과 <br />
            숨겨진 시크릿 스팟 정보를 확인하세요.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
              <FaCheckCircle className="text-green-400" /> 시크릿 맵 열람
            </div>
            <div className="flex items-center gap-2 text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
              <FaCheckCircle className="text-green-400" /> VIP 쿠폰북
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 animate-fadeIn">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">회원가입</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              이미 계정이 있으신가요? <Link to="/login" className="text-purple-600 font-bold hover:underline">로그인하기</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaUser />
              </div>
              <input
                {...register("name", { required: "이름(닉네임)을 입력해주세요" })}
                type="text"
                placeholder="이름 (닉네임)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input
                {...register("email", { 
                  required: "이메일을 입력해주세요",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "올바른 이메일 형식이 아닙니다"
                  }
                })}
                type="email"
                placeholder="이메일 주소"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div className="flex gap-4">
              <div className="w-1/2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaLock />
                </div>
                <input
                  {...register("password", { 
                    required: "비밀번호를 입력해주세요",
                    minLength: { value: 6, message: "6자 이상 입력해주세요" }
                  })}
                  type="password"
                  placeholder="비밀번호"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <div className="w-1/2 relative">
                <input
                  {...register("passwordConfirm", { 
                    required: "비밀번호 확인",
                    validate: (val) => val === password || "비밀번호가 일치하지 않습니다"
                  })}
                  type="password"
                  placeholder="비밀번호 확인"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
                {errors.passwordConfirm && <p className="text-red-500 text-xs mt-1 ml-1">{errors.passwordConfirm.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "가입 처리 중..." : "멤버십 가입하기"}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500">SNS 계정으로 시작</span>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button 
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-white"
              >
                <FaGoogle className="text-red-500" />
                <span className="font-medium text-sm">Google</span>
              </button>
              <button 
                onClick={() => handleSocialLogin('facebook')}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-white"
              >
                <FaFacebook className="text-blue-600" />
                <span className="font-medium text-sm">Facebook</span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            가입 시 VN Lounge의 <Link to="#" className="underline">이용약관</Link> 및 <Link to="#" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;