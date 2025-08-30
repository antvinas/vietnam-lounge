import React, { useEffect, useState } from 'react';

export default function Consent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const v = localStorage.getItem('consent_ok');
    if (v !== '1') setOpen(true);
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white p-4 max-w-lg w-full rounded-2xl shadow-xl">
        <h2 className="text-lg font-semibold mb-2">쿠키 및 광고 동의</h2>
        <p className="text-sm text-gray-600 mb-4">
          사용자 경험 향상을 위해 쿠키를 사용하며, 일부 페이지에서 광고가 노출될 수 있습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => { localStorage.setItem('consent_ok','0'); setOpen(false); }}
            className="px-4 py-2 rounded-xl border">거부</button>
          <button onClick={() => { localStorage.setItem('consent_ok','1'); setOpen(false); }}
            className="px-4 py-2 rounded-xl bg-black text-white">허용</button>
        </div>
      </div>
    </div>
  );
}
