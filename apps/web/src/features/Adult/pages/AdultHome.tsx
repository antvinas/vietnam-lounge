// apps/web/src/features/Adult/pages/AdultHome.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaSearch, FaMapMarkerAlt, FaStar, FaGlassMartiniAlt,
  FaMusic, FaMicrophoneAlt, FaSpa, FaFireAlt, FaCalendarAlt,
  FaArrowRight, FaShieldAlt, FaUserFriends, FaGem, FaGlassCheers
} from "react-icons/fa";

import useUiStore from "@/store/ui.store";

// ✅ Nightlife 히어로(로컬 public 경로)
// 예: apps/web/public/images/hero/nightlife-hero.jpg
const NIGHTLIFE_HERO = "/images/hero/nightlife-hero.png";

// ── [데이터] 분위기(Mood) 태그 ──
const MOODS = [
  { id: "ladies", name: "👯‍♀️ 여성끼리 안전하게", icon: <FaGlassCheers />, link: "/adult/spots?tag=ladies" },
  { id: "couple", name: "👩‍❤️‍👨 커플 데이트", icon: <FaUserFriends />, link: "/adult/spots?tag=couple" },
  { id: "luxury", name: "💎 럭셔리/VIP", icon: <FaGem />, link: "/adult/spots?tag=luxury" },
  { id: "chill", name: "🍸 조용한 칠링", icon: <FaGlassMartiniAlt />, link: "/adult/spots?tag=chill" },
];

const CATEGORIES = [
  { id: "clubs", name: "클럽", icon: <FaMusic />, color: "from-pink-600 to-rose-600", link: "/adult/spots?cat=club" },
  { id: "bars", name: "바 & 라운지", icon: <FaGlassMartiniAlt />, color: "from-violet-600 to-indigo-600", link: "/adult/spots?cat=bar" },
  { id: "karaoke", name: "가라오케", icon: <FaMicrophoneAlt />, color: "from-blue-600 to-cyan-600", link: "/adult/spots?cat=karaoke" },
  { id: "massage", name: "마사지 & 스파", icon: <FaSpa />, color: "from-emerald-600 to-teal-600", link: "/adult/spots?cat=massage" },
];

const HOT_SPOTS = [
  { id: 1, title: "Aura Club Premium", location: "District 1, HCMC", rating: 4.9, reviews: 124, image: "https://images.unsplash.com/photo-1574391884720-3850ea71e834?auto=format&fit=crop&q=80&w=800", tags: ["#힙합", "#럭셔리", "#부킹가능"], verified: true },
  { id: 2, title: "Sky 21 Rooftop", location: "Da Nang City", rating: 4.8, reviews: 89, image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800", tags: ["#야경맛집", "#칵테일", "#커플추천"], verified: true },
  { id: 3, title: "Golden Wellness Spa", location: "Hanoi Center", rating: 4.7, reviews: 56, image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=800", tags: ["#건전마사지", "#한국어가능", "#프라이빗"], verified: true },
  { id: 4, title: "Ocean Lounge", location: "Nha Trang", rating: 4.6, reviews: 42, image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&q=80&w=800", tags: ["#오션뷰", "#후카", "#칠링"], verified: false },
];

const EVENTS = [
  { id: 1, title: "Saturday Night Fever", desc: "DJ SODA 초청 파티", date: "12.24 (Sat) 22:00", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800" },
  { id: 2, title: "Ladies Night Special", desc: "여성 테이블 샴페인 1병 무료", date: "Every Thu 20:00", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800" },
];

const AdultHome = () => {
  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useUiStore();
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Nightlife는 기본 다크 유지 (불필요한 set 방지)
  useEffect(() => {
    if (themeMode !== "dark") setThemeMode("dark");
  }, [themeMode, setThemeMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/adult/spots?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500 selection:text-white pb-24 relative overflow-x-hidden">

      {/* Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-[800px] bg-gradient-to-b from-purple-900/20 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Hero */}
      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center z-10">
        <div className="absolute inset-0 z-0">
          <img
            src={NIGHTLIFE_HERO}
            alt="Nightlife Hero"
            className="w-full h-full object-cover opacity-85"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-[#050505]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl w-full mt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-purple-200">
                LIVE : 호치민의 밤은 지금 시작됩니다
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-gray-400 mb-8 drop-shadow-2xl leading-tight">
              Discover Vietnam&apos;s <br className="hidden md:block" />
              <span className="text-purple-400">Hottest Nightlife</span>
            </h1>

            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative flex items-center bg-gray-900/80 backdrop-blur-xl rounded-full border border-gray-700 p-2 shadow-2xl">
                <FaSearch className="ml-4 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="지역, 클럽, 분위기 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-gray-500 text-base outline-none"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full font-bold transition-all transform hover:scale-105 shrink-0"
                >
                  Search
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Mood */}
      <section className="relative z-20 -mt-8 px-4 max-w-7xl mx-auto mb-12">
        <div className="flex flex-col items-center">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Find your Vibe</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {MOODS.map((mood) => (
              <Link
                key={mood.id}
                to={mood.link}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-800/80 backdrop-blur border border-gray-700 text-sm font-medium text-gray-300 hover:bg-purple-900/80 hover:border-purple-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all"
              >
                {mood.icon} {mood.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="px-4 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <Link key={cat.id} to={cat.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl hover:bg-gray-700/60 hover:border-purple-500/50 transition-all group cursor-pointer text-center shadow-lg h-full flex flex-col items-center justify-center"
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl text-white mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {cat.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-100">{cat.name}</h3>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Spots */}
      <section className="px-4 max-w-7xl mx-auto relative z-10 mb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-white">
              <span className="text-purple-500"><FaFireAlt /></span>
              지금 뜨는 핫플레이스
            </h2>
            <p className="text-gray-400 mt-2 text-sm">실시간 인기 예약 및 검증된 스팟</p>
          </div>
          <Link to="/adult/spots" className="hidden md:flex items-center text-sm font-semibold text-gray-300 hover:text-white transition">
            전체보기 <FaArrowRight className="ml-2 text-xs" />
          </Link>
        </div>

        <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-8 md:pb-0 scrollbar-hide snap-x">
          {HOT_SPOTS.map((spot) => (
            <Link key={spot.id} to={`/adult/spots/${spot.id}`} className="min-w-[280px] md:min-w-0 snap-center group">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 shadow-2xl bg-gray-900">
                <img src={spot.image} alt={spot.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 text-xs font-bold text-yellow-400">
                  <FaStar /> {spot.rating}
                </div>

                {spot.verified && (
                  <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 text-[10px] font-bold text-white shadow-lg">
                    <FaShieldAlt /> VN Verified
                  </div>
                )}

                <div className="absolute bottom-0 left-0 w-full p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-1 leading-tight">{spot.title}</h3>
                  <div className="flex items-center text-sm text-gray-300 mb-3">
                    <FaMapMarkerAlt className="mr-1 text-purple-400" /> {spot.location}
                  </div>
                  <div className="flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {spot.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-1 bg-purple-600/80 rounded text-white font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="py-16 bg-gradient-to-r from-purple-900/20 to-blue-900/20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">🎉 다가오는 파티 & 이벤트</h2>
            <Link to="/adult/events" className="text-sm text-purple-400 hover:text-white transition">일정 더보기</Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {EVENTS.map((event) => (
              <Link key={event.id} to={`/adult/events/${event.id}`} className="flex bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden hover:bg-gray-700/80 transition-colors group">
                <div className="w-1/3 relative overflow-hidden">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="w-2/3 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <FaCalendarAlt /> {event.date}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{event.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{event.desc}</p>
                  <span className="text-xs text-gray-500 underline decoration-gray-600 underline-offset-4 group-hover:text-white group-hover:decoration-purple-500 transition-all">
                    자세히 보기
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer info */}
      <div className="mt-20 text-center px-6 pb-16">
        <div className="inline-block p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
          <p className="text-sm md:text-base font-medium text-gray-400 leading-relaxed">
            VN LOUNGE NIGHTLIFE는 만 19세 이상 성인을 위한 정보 제공 플랫폼입니다.<br className="hidden md:block" />
            건전하고 안전한 나이트 라이프 문화를 지향하며,{" "}
            <span className="text-red-400 font-bold">성매매 알선 등 불법적인 서비스에 대한 정보는 절대 제공하지 않습니다.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdultHome;
