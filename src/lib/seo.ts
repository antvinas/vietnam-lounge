export function title(t?: string) {
  const base = 'VN Lounge';
  return t ? `${t} · ${base}` : base;
}
export function desc(d?: string) {
  return d || '베트남 여행/커뮤니티/성인 정보 플랫폼';
}
