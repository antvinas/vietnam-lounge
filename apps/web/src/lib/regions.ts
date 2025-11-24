/**
 * 베트남 지역별 주요 도시 트리 데이터
 * 북부 / 중부 / 남부로 구분
 */
export const regionTree = {
  north: {
    label: "북부",
    cities: ["하노이", "하롱베이", "닌빈", "하이퐁", "사파"],
  },
  central: {
    label: "중부",
    cities: ["다낭", "호이안", "달랏", "후에", "꽝응아이"],
  },
  south: {
    label: "남부",
    cities: ["호치민", "푸꾸옥", "까마우", "껀터", "빈롱"],
  },
} as const;

export type RegionKey = keyof typeof regionTree;

export function getAllCities(): string[] {
  return Object.values(regionTree).flatMap((r) => r.cities);
}
