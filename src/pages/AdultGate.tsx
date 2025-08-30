import React from 'react';

export default function AdultGate() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">성인 확인</h1>
      <p className="text-gray-600 mb-6">만 18세 이상입니까?</p>
      <div className="flex gap-2">
        <button onClick={() => { localStorage.setItem('adult_ok','1'); window.location.href = '/'; }}
          className="px-4 py-2 rounded-xl bg-black text-white">예</button>
        <button onClick={() => { localStorage.setItem('adult_ok','0'); window.location.href = '/'; }}
          className="px-4 py-2 rounded-xl border">아니오</button>
      </div>
    </div>
  );
}
