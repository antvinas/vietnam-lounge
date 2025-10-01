import React, { useState } from 'react';

interface AdultGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AdultGate: React.FC<AdultGateProps> = ({ onSuccess, onCancel }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleEnter = () => {
    if (dontShowAgain) {
      localStorage.setItem('adult_gate_preference', 'hide');
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center p-8 max-w-md w-full rounded-2xl shadow-lifted bg-surface border border-border">
        <h1 className="text-h2 text-text-main mb-4">🌙 Nightlife Zone 안내</h1>
        <div className="text-body text-text-secondary mb-8 space-y-2">
          <p>이곳은 베트남의 밤문화를 소개하는 전용 공간입니다.</p>
          <p>다소 성인 친화적 콘텐츠가 포함될 수 있어요. 편안하지 않다면 메인으로 돌아가 주세요.</p>
        </div>

        <div className="mb-6">
            <label className="flex items-center justify-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                다음부터 이 안내 보지 않기
            </label>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleEnter}
            className="bg-primary hover:opacity-90 text-white font-bold py-3 px-8 rounded-full transition-all duration-240 transform hover:scale-105 shadow-subtle"
          >
            입장하기
          </button>
          <button
            onClick={onCancel}
            className="bg-transparent hover:bg-surface text-text-secondary font-bold py-3 px-8 rounded-full transition-colors duration-240"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdultGate;
