// apps/web/src/features/plan/data/templates/hanoi.3n4d.ts

import type { PlanTemplate } from "@/types/plan.template";

const tpl: PlanTemplate = {
  meta: {
    id: "hanoi-3n4d",
    city: "hanoi",
    title: "하노이+하롱베이 3박4일 정석",
    nights: 3,
    defaultMode: "car",
    currency: "VND",
    plannedBudgetVnd: 6500000,
    summary: "구시가지 시티투어에 유네스코 유산 하롱베이 크루즈까지 포함된 정석 코스",
  },
  base: {
    name: "Old Quarter 호텔",
    location: { lat: 21.035, lng: 105.85 },
  },
  days: [
    {
      // [1일차] 도착 & 호안끼엠
      items: [
        {
          kind: "activity",
          name: "노이바이 공항 도착 · 시내 이동",
          location: { lat: 21.217, lng: 105.804 },
          timeStartMin: 660,
          timeEndMin: 720,
          costVnd: 350000,
        },
        {
          kind: "activity",
          name: "호텔 체크인",
          location: { lat: 21.035, lng: 105.85 },
          timeStartMin: 720,
          timeEndMin: 780,
        },
        {
          kind: "meal",
          name: "분짜 닥킴 (점심)",
          location: { lat: 21.033, lng: 105.849 },
          timeStartMin: 780,
          timeEndMin: 870,
          costVnd: 100000,
        },
        {
          kind: "spot",
          name: "호안끼엠 호수 & 응옥선 사당",
          location: { lat: 21.0287, lng: 105.8521 },
          timeStartMin: 900,
          timeEndMin: 1020,
        },
        {
          kind: "spot",
          name: "수상인형극 관람",
          location: { lat: 21.030, lng: 105.853 },
          timeStartMin: 1050,
          timeEndMin: 1110,
          costVnd: 200000,
        },
        {
          kind: "meal",
          name: "맥주거리 야식",
          location: { lat: 21.035, lng: 105.853 },
          timeStartMin: 1140,
          timeEndMin: 1260,
          costVnd: 150000,
        },
      ],
    },
    {
      // [2일차] 시티 투어 (역사문화)
      items: [
        {
          kind: "spot",
          name: "호찌민 묘소 & 바딘 광장",
          location: { lat: 21.0367, lng: 105.8347 },
          timeStartMin: 540,
          timeEndMin: 660,
          note: "오전에 방문해야 입장 가능 (반바지 X)",
        },
        {
          kind: "spot",
          name: "일주사 (한기둥 사원)",
          location: { lat: 21.035, lng: 105.834 },
          timeStartMin: 660,
          timeEndMin: 690,
        },
        {
          kind: "spot",
          name: "문묘 (국자감)",
          location: { lat: 21.0274, lng: 105.8354 },
          timeStartMin: 810,
          timeEndMin: 930,
          costVnd: 30000,
        },
        {
          kind: "spot",
          name: "기찻길 마을 (Train Street) 카페",
          location: { lat: 21.024, lng: 105.842 },
          timeStartMin: 960,
          timeEndMin: 1050,
          costVnd: 50000,
        },
        {
          kind: "spot",
          name: "성 요셉 성당",
          location: { lat: 21.0288, lng: 105.848 },
          timeStartMin: 1080,
          timeEndMin: 1140,
        },
      ],
    },
    {
      // [3일차] 하롱베이 당일 투어
      items: [
        {
          kind: "activity",
          name: "하롱베이 투어 픽업",
          location: { lat: 21.035, lng: 105.85 },
          timeStartMin: 480, // 08:00
          timeEndMin: 720,
          costVnd: 1200000,
          note: "왕복 이동시간 포함 약 3~4시간 소요",
        },
        {
          kind: "spot",
          name: "하롱베이 크루즈 & 점심",
          location: { lat: 20.906, lng: 107.073 },
          timeStartMin: 720,
          timeEndMin: 960,
          note: "승솟 동굴, 티톱섬 전망대 등",
        },
        {
          kind: "activity",
          name: "하노이 복귀",
          location: { lat: 21.035, lng: 105.85 },
          timeStartMin: 960,
          timeEndMin: 1200, // 20:00 도착
        },
      ],
    },
    {
      // [4일차] 롯데전망대 or 쇼핑 & 출국
      items: [
        {
          kind: "spot",
          name: "롯데센터 하노이 전망대/마트",
          location: { lat: 21.032, lng: 105.812 },
          timeStartMin: 600,
          timeEndMin: 780,
          note: "기념품 쇼핑하기 좋음",
        },
        {
          kind: "meal",
          name: "포 10 리꿕수 (쌀국수)",
          location: { lat: 21.030, lng: 105.849 },
          timeStartMin: 810,
          timeEndMin: 870,
          costVnd: 70000,
        },
        {
          kind: "activity",
          name: "공항 이동 & 출국",
          location: { lat: 21.217, lng: 105.804 },
          timeStartMin: 900,
          timeEndMin: 960,
        },
      ],
    },
  ],
};

export default tpl;