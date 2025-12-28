// apps/web/src/features/plan/data/templates/danang.3n4d.ts

import type { PlanTemplate } from "@/types/plan.template";

const tpl: PlanTemplate = {
  meta: {
    id: "danang-3n4d",
    city: "danang",
    title: "다낭 3박4일 샘플",
    nights: 3,
    defaultMode: "car",
    currency: "VND",
    plannedBudgetVnd: 7800000,
    summary: "미케비치·용다리·바나힐·호이안까지 담은 3박4일 코스",
  },
  base: {
    name: "My Khe Beach 호텔",
    location: { lat: 16.067, lng: 108.246 },
  },
  days: [
    {
      label: "DAY 1 · 도착 & 미케비치",
      items: [
        {
          kind: "activity",
          name: "다낭 공항 도착 · 호텔 이동",
          location: { lat: 16.043, lng: 108.199 },
          timeStartMin: 660,
          timeEndMin: 720,
          costVnd: 200000,
        },
        {
          kind: "activity",
          name: "호텔 체크인 · 점심",
          location: { lat: 16.067, lng: 108.246 },
          timeStartMin: 720,
          timeEndMin: 810,
          costVnd: 150000,
        },
        {
          kind: "spot",
          name: "미케 비치 수영 · 산책",
          location: { lat: 16.0694, lng: 108.2097 },
          timeStartMin: 900,
          timeEndMin: 1020,
        },
        {
          kind: "meal",
          name: "해산물 저녁 (미케 인근)",
          location: { lat: 16.066, lng: 108.235 },
          timeStartMin: 1080,
          timeEndMin: 1170,
          costVnd: 300000,
        },
        {
          kind: "spot",
          name: "용다리 · 한강 야경",
          location: { lat: 16.074, lng: 108.2139 },
          timeStartMin: 1200,
          timeEndMin: 1290,
        },
      ],
    },
    {
      label: "DAY 2 · 바나힐 & 골든브리지",
      items: [
        {
          kind: "activity",
          name: "호텔 조식 · 바나힐 이동",
          location: { lat: 16.067, lng: 108.246 },
          timeStartMin: 450,
          timeEndMin: 510,
          costVnd: 350000,
        },
        {
          kind: "spot",
          name: "바나힐 케이블카 탑승",
          location: { lat: 16.0262, lng: 108.0329 },
          timeStartMin: 510,
          timeEndMin: 540,
        },
        {
          kind: "spot",
          name: "골든브리지 & 정원 산책",
          location: { lat: 15.9949, lng: 107.9963 },
          timeStartMin: 540,
          timeEndMin: 660,
          openMin: 420,
          closeMin: 1260,
        },
        {
          kind: "spot",
          name: "프렌치 빌리지 · 놀이기구",
          location: { lat: 15.996, lng: 107.997 },
          timeStartMin: 660,
          timeEndMin: 900,
        },
        {
          kind: "meal",
          name: "다낭 시내 귀환 · 한강변 저녁",
          location: { lat: 16.0678, lng: 108.2062 },
          timeStartMin: 1080,
          timeEndMin: 1200,
          costVnd: 250000,
        },
      ],
    },
    {
      label: "DAY 3 · 마블마운틴 & 호이안",
      items: [
        {
          kind: "spot",
          name: "마블마운틴(오전 트래킹)",
          location: { lat: 15.9755, lng: 108.2609 },
          timeStartMin: 540,
          timeEndMin: 660,
          openMin: 420,
          closeMin: 1050,
        },
        {
          kind: "meal",
          name: "호이안 이동 · 점심",
          location: { lat: 15.8797, lng: 108.3319 },
          timeStartMin: 720,
          timeEndMin: 780,
          costVnd: 150000,
        },
        {
          kind: "spot",
          name: "호이안 구시가지 산책",
          location: { lat: 15.8797, lng: 108.3319 },
          timeStartMin: 780,
          timeEndMin: 1020,
        },
        {
          kind: "meal",
          name: "호이안 등불 야경 · 까오러우 저녁",
          location: { lat: 15.8773, lng: 108.3259 },
          timeStartMin: 1080,
          timeEndMin: 1230,
          costVnd: 220000,
        },
        {
          kind: "activity",
          name: "다낭 호텔 귀환",
          location: { lat: 16.067, lng: 108.246 },
          timeStartMin: 1230,
          timeEndMin: 1320,
        },
      ],
    },
    {
      label: "DAY 4 · 카페 & 출국",
      items: [
        {
          kind: "spot",
          name: "카페·스파 / 자유시간",
          location: { lat: 16.067, lng: 108.246 },
          timeStartMin: 540,
          timeEndMin: 660,
        },
        {
          kind: "activity",
          name: "체크아웃 · 공항 이동",
          location: { lat: 16.067, lng: 108.246 },
          timeStartMin: 720,
          timeEndMin: 780,
          costVnd: 150000,
        },
        {
          kind: "activity",
          name: "다낭 공항 출발",
          location: { lat: 16.043, lng: 108.199 },
          timeStartMin: 840,
          timeEndMin: 900,
        },
      ],
    },
  ],
};

export default tpl;