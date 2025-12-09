import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, RefreshCw, Calendar, Coffee, Gift, ChevronUp } from "lucide-react";

interface WidgetTabsProps {
  spots?: any[];
  mode?: "explorer" | "nightlife";
}

const WidgetTabs = ({ spots = [], mode = "explorer" }: WidgetTabsProps) => {
  const [open, setOpen] = useState(false);
  const accent = mode === "nightlife" ? "bg-purple-600" : "bg-[#2BB6C5]";

  const tabs = [
    { icon: <Sun size={18} />, label: "날씨" },
    { icon: <RefreshCw size={18} />, label: "환율" },
    { icon: <Calendar size={18} />, label: "주말" },
    { icon: <Coffee size={18} />, label: "오픈" },
    { icon: <Gift size={18} />, label: "쿠폰" },
  ];

  return (
    <div className="relative">
      {/* 열림 상태 */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="widget-panel"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-14 right-0 w-64 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">TODAY’S WEATHER</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700 transition"
              >
                닫기
              </button>
            </div>

            <div className="p-4 space-y-2 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">호치민 현재 기상 — 맑음</p>
              <p className="text-3xl font-bold text-gray-800">30°C</p>
              <p className="text-xs text-gray-400 mt-1">오후 07:52 기준</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 위젯 버튼 */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center gap-2 rounded-full ${accent} text-white shadow-lg px-5 py-3 text-sm font-semibold transition-all`}
      >
        <ChevronUp
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
        {open ? "닫기" : "위젯 열기"}
      </motion.button>
    </div>
  );
};

export default WidgetTabs;
