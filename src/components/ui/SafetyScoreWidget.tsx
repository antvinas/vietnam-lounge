import React from 'react';
type ScoreInput = { reports?: number; reviews?: number; rating?: number; verified?: boolean };
function computeScore(x: ScoreInput) {
  const base = (x.rating ?? 3) * 20; // 0..100
  const penalty = Math.min(40, (x.reports ?? 0) * 5);
  const bonus = (x.verified ? 10 : 0) + Math.min(20, (x.reviews ?? 0) * 0.2);
  return Math.max(0, Math.min(100, Math.round(base - penalty + bonus)));
}
export default function SafetyScoreWidget({ input }:{input: ScoreInput}) {
  const score = computeScore(input);
  const level = score >= 80 ? '안전' : score >= 60 ? '보통' : '주의';
  return (
    <div className="rounded-2xl p-4 border shadow-sm grid gap-1">
      <div className="text-sm text-gray-500">안전 점수</div>
      <div className="text-2xl font-bold">{score}</div>
      <div className="text-xs text-gray-500">{level}</div>
    </div>
  );
}
