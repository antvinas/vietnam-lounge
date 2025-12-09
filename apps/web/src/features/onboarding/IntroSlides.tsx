import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMoon, FaSun, FaMapMarkedAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/**
 * IntroSlides.tsx
 * - 첫 방문 시 주간/야간 모드, 서비스 기능 소개용 온보딩 슬라이드
 * - localStorage 플래그로 한 번만 표시
 */

const slides = [
  {
    id: 1,
    icon: <FaSun className="text-4xl text-[#2BB6C5]" />,
    title: "주간 모드",
    desc: "명소, 카페, 맛집 등 낮의 베트남을 탐험하세요.",
    bg: "from-[#D9F9FF] to-[#A8E3EB]",
  },
  {
    id: 2,
    icon: <FaMoon className="text-4xl text-[#8B5CF6]" />,
    title: "야간 모드",
    desc: "클럽, 바, 라운지 등 나이트라이프를 경험하세요.",
    bg: "from-[#2E1065] to-[#6D28D9]",
  },
  {
    id: 3,
    icon: <FaMapMarkedAlt className="text-4xl text-[#10B981]" />,
    title: "지도 탐색",
    desc: "위젯과 함께 편리하게 위치를 확인하고 이동하세요.",
    bg: "from-[#DCFCE7] to-[#BBF7D0]",
  },
];

const IntroSlides = () => {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem("onboardingSeen");
    if (seen) setShow(false);
  }, []);

  const handleNext = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else {
      localStorage.setItem("onboardingSeen", "true");
      setShow(false);
      navigate("/");
    }
  };

  if (!show) return null;

  const slide = slides[index];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={slide.id}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br ${slide.bg} text-center text-gray-800 dark:text-white`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key={slide.id}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-sm px-6"
          >
            <div className="mb-6 flex justify-center">{slide.icon}</div>
            <h2 className="text-3xl font-bold mb-2">{slide.title}</h2>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              {slide.desc}
            </p>
          </motion.div>

          <div className="absolute bottom-20 flex gap-2">
            {slides.map((s, i) => (
              <div
                key={s.id}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  i === index ? "bg-gray-800 dark:bg-white w-5" : "bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="absolute bottom-10 rounded-full bg-black/80 px-6 py-2 text-sm font-semibold text-white hover:bg-black transition-all"
          >
            {index === slides.length - 1 ? "시작하기" : "다음"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroSlides;
