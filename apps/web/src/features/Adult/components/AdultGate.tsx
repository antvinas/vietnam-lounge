import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Header.tsx에서 넘겨주는 이름과 정확히 일치시켰습니다.
interface AdultGateProps {
  isOpen: boolean;    // ★ 핵심: 열림 상태 제어
  onPass: () => void; // 입장하기 버튼 클릭 시 실행
  onClose: () => void;// 나가기(취소) 버튼 클릭 시 실행
}

const AdultGate = ({ isOpen, onPass, onClose }: AdultGateProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // 1. 열림/닫힘 감지 및 포커스, 스크롤 제어
  useEffect(() => {
    if (!isOpen) return; // 닫혀있으면 아무것도 실행하지 않음

    // 현재 포커스 위치 저장
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    
    // 모달 내부로 포커스 이동 (웹 접근성)
    const target = primaryButtonRef.current ?? dialogRef.current;
    requestAnimationFrame(() => target?.focus());

    // 배경 스크롤 막기
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 닫힐 때 복구
    return () => {
      document.body.style.overflow = originalOverflow;
      lastActiveRef.current?.focus?.();
    };
  }, [isOpen]);

  // 2. 키보드 ESC 키로 닫기
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  const handleEnter = () => {
    // '다시 보지 않기' 체크 시 로컬스토리지 저장 (선택 사항)
    if (dontShowAgain) localStorage.setItem("adult_gate_preference", "hide");
    onPass();
  };

  // ★ 가장 중요한 수정: isOpen이 false면 아무것도 그리지 않음!
  if (!isOpen) return null;

  // React Portal을 사용해 body 위에 띄움
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-3xl bg-gray-900 border border-purple-500/30 p-8 shadow-2xl relative overflow-hidden"
        tabIndex={-1}
      >
        {/* 상단 그라데이션 라인 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
        
        <div className="text-center mt-2">
          <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-5 text-3xl shadow-inner">
            🔞
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Nightlife 입장
          </h2>
          <div className="space-y-2 mb-8 text-gray-400 text-sm leading-relaxed">
            <p>이곳은 성인 전용 공간입니다.</p>
            <p>미성년자의 출입을 엄격히 금지합니다.</p>
            <p className="text-purple-400 font-bold text-base mt-2">만 19세 이상이신가요?</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-gray-800 transition"
            >
              나가기
            </button>
            <button
              ref={primaryButtonRef}
              onClick={handleEnter}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:opacity-90 transition shadow-lg shadow-purple-900/50"
            >
              입장하기
            </button>
          </div>
          
          <div className="mt-5 flex items-center justify-center gap-2">
            <input 
              type="checkbox" 
              id="dontShow" 
              className="rounded bg-gray-800 border-gray-600 text-purple-600 focus:ring-purple-500"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <label htmlFor="dontShow" className="text-xs text-gray-500 cursor-pointer select-none hover:text-gray-400">
              브라우저를 닫기 전까지 묻지 않기
            </label>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdultGate;