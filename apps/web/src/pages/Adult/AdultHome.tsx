// src/pages/Adult/AdultHome.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const AdultHome = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#0E1526] text-white overflow-hidden">
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={show ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex flex-col items-center justify-center px-4 py-24 text-center max-w-3xl"
      >
        <div className="rounded-full bg-[#8B5CF6]/20 px-6 py-2 text-sm font-semibold text-[#C4B5FD] mb-6">
          NIGHTLIFE MODE
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">베트남의 밤을 탐험하세요</h1>
        <p className="text-[17px] text-gray-300 mb-10 leading-relaxed">
          클럽, 라운지, 바 등 성인 전용 핫플레이스를 둘러보고,
          <br className="hidden sm:block" />
          생생한 후기를 확인하며 새로운 경험을 즐겨보세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/adult/spots"
            className="rounded-full bg-[#8B5CF6] px-8 py-3 text-sm font-semibold text-white hover:bg-[#7C3AED] transition"
          >
            나이트 스팟 보기
          </Link>
        </div>

        <p className="mt-10 text-xs text-gray-500">※ 본 섹션은 만 19세 이상 이용자만 접근할 수 있습니다.</p>
      </motion.section>
    </main>
  );
};

export default AdultHome;
