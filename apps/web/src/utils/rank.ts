/**
 * Reddit hot 알고리즘을 단순화한 버전.
 * createdAtSeconds: Unix epoch seconds
 */
export function computeHotScore(
  upVotes: number,
  downVotes: number,
  createdAtSeconds: number
): number {
  const s = upVotes - downVotes;
  const order = Math.log10(Math.max(Math.abs(s), 1));
  const sign = s > 0 ? 1 : s < 0 ? -1 : 0;
  const seconds = createdAtSeconds - 1134028003; // Reddit magic number
  return Number((sign * order + seconds / 45000).toFixed(7));
}

/** 윌슨 하한값 (댓글 정렬 등 신뢰도 점수에 사용 가능) */
export function wilsonLowerBound(up: number, down: number, z = 1.96): number {
  const n = up + down;
  if (n === 0) return 0;
  const p = up / n;
  const left = p + (z * z) / (2 * n);
  const right = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const under = 1 + (z * z) / n;
  return (left - right) / under;
}
