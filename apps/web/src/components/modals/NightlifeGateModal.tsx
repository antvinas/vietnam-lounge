import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NightlifeGateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * NightlifeGateModal — 성인 전용 입장 게이트
 */
const NightlifeGateModal = ({ isOpen, onConfirm, onCancel }: NightlifeGateModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-[90%] max-w-md rounded-3xl bg-surface dark:bg-[#1E1E2F] p-8 text-center shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-3">
              성인 전용 콘텐츠입니다
            </h2>
            <p className="text-sm text-text-secondary dark:text-gray-400 mb-8">
              본 페이지는 만 19세 이상 이용자만 열람할 수 있습니다.
              <br />
              입장하시겠습니까?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onCancel}
                className="rounded-full border border-border bg-background-sub dark:bg-transparent px-6 py-2 text-sm font-semibold text-text-secondary hover:bg-background hover:text-text-main transition"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                className="rounded-full bg-[#8B5CF6] px-6 py-2 text-sm font-semibold text-white hover:bg-[#7C3AED] transition"
              >
                입장하기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NightlifeGateModal;
