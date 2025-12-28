// apps/web/src/features/plan/data/templates/nhatrang.3n4d.ts

import type { PlanTemplate } from "@/types/plan.template";

const tpl: PlanTemplate = {
  meta: {
    id: "nhatrang-3n4d",
    city: "nhatrang",
    title: "나트랑 3박4일 액티비티 팩",
    nights: 3,
    defaultMode: "car",
    currency: "VND",
    plannedBudgetVnd: 7500000,
    summary: "빈원더스·머드온천·포나가르 사원까지, 휴양과 재미를 모두 잡은 코스",
  },
  base: {
    name: "나트랑 시내 호텔 (여행자거리)",
    location: { lat: 12.238, lng: 109.196 },
  },
  days: [
    {
      label: "DAY 1 · 도착 & 야시장",
      items: [
        {
          kind: "activity",
          name: "깜란 공항 도착 · 시내 이동",
          location: { lat: 11.998, lng: 109.219 }, // 깜란 공항
          timeStartMin: 780, // 13:00
          timeEndMin: 840,
          costVnd: 350000,
          note: "택시/픽업 차량으로 약 40분 소요",
        },
        {
          kind: "activity",
          name: "호텔 체크인 · 휴식",
          location: { lat: 12.238, lng: 109.196 },
          timeStartMin: 840,
          timeEndMin: 960,
        },
        {
          kind: "meal",
          name: "나트랑 야시장 해산물 저녁",
          location: { lat: 12.239, lng: 109.196 },
          timeStartMin: 1080,
          timeEndMin: 1200,
          costVnd: 400000,
        },
        {
          kind: "spot",
          name: "나트랑 비치 밤 산책",
          location: { lat: 12.240, lng: 109.197 },
          timeStartMin: 1200,
          timeEndMin: 1260,
        },
      ],
    },
    {
      label: "DAY 2 · 빈원더스 올데이",
      items: [
        {
          kind: "activity",
          name: "빈펄섬 이동 (케이블카/스피드보트)",
          location: { lat: 12.213, lng: 109.220 }, // 선착장
          timeStartMin: 540,
          timeEndMin: 600,
          costVnd: 880000, // 입장권 포함 예상
        },
        {
          kind: "spot",
          name: "빈원더스 나트랑 (놀이공원 & 워터파크)",
          location: { lat: 12.218, lng: 109.243 }, // 빈펄섬 내부
          timeStartMin: 600,
          timeEndMin: 1020, // 17:00까지
          note: "워터파크, 동물원, 알파인 코스터 즐기기",
        },
        {
          kind: "spot",
          name: "타타쇼 (Tata Show) 관람",
          location: { lat: 12.218, lng: 109.243 },
          timeStartMin: 1140, // 19:00~
          timeEndMin: 1200,
        },
        {
          kind: "activity",
          name: "시내 복귀",
          location: { lat: 12.238, lng: 109.196 },
          timeStartMin: 1230,
          timeEndMin: 1290,
        },
      ],
    },
    {
      label: "DAY 3 · 시티 투어 & 머드 온천",
      items: [
        {
          kind: "spot",
          name: "포나가르 사원 (참파 유적)",
          location: { lat: 12.265, lng: 109.195 },
          timeStartMin: 540,
          timeEndMin: 660,
          costVnd: 30000,
        },
        {
          kind: "spot",
          name: "롱선사 (거대 좌불상)",
          location: { lat: 12.251, lng: 109.180 },
          timeStartMin: 690,
          timeEndMin: 780,
        },
        {
          kind: "meal",
          name: "현지식 반쎄오 점심",
          location: { lat: 12.243, lng: 109.193 },
          timeStartMin: 780,
          timeEndMin: 870,
          costVnd: 150000,
        },
        {
          kind: "spot",
          name: "아이리조트 머드 온천",
          location: { lat: 12.290, lng: 109.175 },
          timeStartMin: 930,
          timeEndMin: 1110,
          costVnd: 350000,
          note: "여행의 피로 풀기, 수영복 지참",
        },
        {
          kind: "meal",
          name: "루프탑 바 & 칵테일",
          location: { lat: 12.241, lng: 109.196 }, // 쉐라톤/인터컨 등
          timeStartMin: 1200,
          timeEndMin: 1320,
          costVnd: 300000,
        },
      ],
    },
    {
      label: "DAY 4 · 쇼핑 & 출국",
      items: [
        {
          kind: "spot",
          name: "담 시장 (Dam Market) 쇼핑",
          location: { lat: 12.254, lng: 109.191 },
          timeStartMin: 600,
          timeEndMin: 720,
          note: "라탄백, 건망고 등 기념품",
        },
        {
          kind: "meal",
          name: "CCCP 커피 (코코넛 커피)",
          location: { lat: 12.242, lng: 109.193 },
          timeStartMin: 720,
          timeEndMin: 810,
          costVnd: 60000,
        },
        {
          kind: "activity",
          name: "호텔 체크아웃 · 공항 이동",
          location: { lat: 12.238, lng: 109.196 },
          timeStartMin: 840,
          timeEndMin: 900,
        },
        {
          kind: "activity",
          name: "깜란 공항 출발",
          location: { lat: 11.998, lng: 109.219 },
          timeStartMin: 960,
          timeEndMin: 1020,
        },
      ],
    },
  ],
};

export default tpl;