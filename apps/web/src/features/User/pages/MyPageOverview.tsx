import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FaTicketAlt, FaHeart, FaPen, FaCrown, FaChevronRight, FaUserShield } from "react-icons/fa";
import { getUserProfile, getUserActivitySummary } from "../api/user.api";
import toast from "react-hot-toast";

const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const MyPageOverview = () => {
  const { data: profile } = useQuery({ queryKey: ["userProfile"], queryFn: getUserProfile });
  const { data: summary } = useQuery({ queryKey: ["userSummary"], queryFn: getUserActivitySummary });

  if (!profile) return <div className="p-8 text-center">Loading...</div>;

  const isAdmin = profile.role === 'admin';

  return (
    <div className="space-y-8">
      {/* 1. 멤버십 카드 */}
      <div className={`relative w-full h-56 rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.01] ${
        isAdmin 
          ? "bg-gradient-to-r from-gray-900 to-black border border-yellow-600" 
          : "bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-900"
      }`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-light tracking-widest opacity-80">VN LOUNGE MEMBERSHIP</h3>
              <div className="mt-1 flex items-center gap-2">
                {isAdmin ? <FaUserShield className="text-green-400 text-xl" /> : <FaCrown className="text-yellow-400 text-xl" />}
                <span className={`text-2xl font-bold tracking-wide uppercase ${isAdmin ? "text-green-400" : "text-white"}`}>
                  {profile.grade}
                </span>
              </div>
            </div>
            <span className="font-bold opacity-50 italic">VN LOUNGE</span>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4">
              <img 
                src={profile.avatar || DEFAULT_AVATAR} 
                alt="Avatar" 
                className="w-14 h-14 rounded-full border-2 border-white/30 object-cover bg-white"
              />
              <div>
                <p className="text-lg font-bold">{profile.nickname}</p>
                <p className="text-xs opacity-70">{profile.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60">Member Since</p>
              <p className="font-mono">{profile.joinDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 등급 진행률 (관리자가 아닐 때만 표시) */}
      {!isAdmin && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-gray-500 dark:text-gray-400">NEXT: <span className="text-purple-600 dark:text-purple-400 font-bold">{summary?.nextGradeName}</span></span>
            <span className="text-gray-900 dark:text-white">{summary?.nextGradeProgress}% 달성</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-1000" 
              style={{ width: `${summary?.nextGradeProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">리뷰를 3개 더 작성하면 등급이 오릅니다!</p>
        </div>
      )}

      {/* 3. 활동 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <Link to="/mypage/coupons" className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-purple-500 transition-colors group text-center cursor-pointer">
          <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 mb-3 group-hover:scale-110 transition-transform">
            <FaTicketAlt />
          </div>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.couponCount}</h4>
          <p className="text-xs text-gray-500">내 쿠폰</p>
        </Link>

        <Link to="/mypage/favorites" className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-pink-500 transition-colors group text-center cursor-pointer">
          <div className="inline-flex p-3 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-500 mb-3 group-hover:scale-110 transition-transform">
            <FaHeart />
          </div>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.favoriteCount}</h4>
          <p className="text-xs text-gray-500">관심 장소</p>
        </Link>

        <Link to="/mypage/reviews" className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-500 transition-colors group text-center cursor-pointer">
          <div className="inline-flex p-3 rounded-full bg-green-50 dark:bg-green-900/30 text-green-500 mb-3 group-hover:scale-110 transition-transform">
            <FaPen />
          </div>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{summary?.reviewCount}</h4>
          <p className="text-xs text-gray-500">작성 리뷰</p>
        </Link>
      </div>

      {/* 4. 관리자 메뉴 */}
      {isAdmin && (
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaUserShield className="text-green-400"/> 관리자 바로가기
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin" className="block p-3 bg-gray-800 rounded-lg text-center hover:bg-gray-700 transition">
              대시보드
            </Link>
            <Link to="/admin/spots" className="block p-3 bg-gray-800 rounded-lg text-center hover:bg-gray-700 transition">
              스팟 관리
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPageOverview;