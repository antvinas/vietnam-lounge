import type { PlanTemplate } from "@/types/plan.template";

const tpl: PlanTemplate = {
  meta: {
    id: "phuquoc-2n3d",
    city: "Phu Quoc",
    title: "푸꾸옥 2박3일 샘플",
    nights: 2,
    defaultMode: "car",
    currency: "VND",
    plannedBudgetVnd: 6500000,
    summary: "듀엉동·야시장 + 북부 사파리·빈원더를 압축한 2박3일 코스",
  },
  base: {
    name: "Duong Dong 호텔",
    location: { lat: 10.222, lng: 103.959 },
  },
  days: [
    {
      label: "DAY 1 · 도착 & 듀엉동 야시장",
      items: [
        {
          kind: "activity",
          name: "푸꾸옥 공항 도착 · 호텔 이동",
          location: { lat: 10.227, lng: 103.967 },
          timeStartMin: 660,
          timeEndMin: 700,
          costVnd: 200000,
        },
        {
          kind: "activity",
          name: "호텔 체크인 · 점심",
          location: { lat: 10.222, lng: 103.959 },
          timeStartMin: 700,
          timeEndMin: 780,
          costVnd: 150000,
        },
        {
          kind: "spot",
          name: "롱비치/근처 비치 수영",
          location: { lat: 10.203, lng: 103.957 },
          timeStartMin: 900,
          timeEndMin: 1020,
        },
        {
          kind: "spot",
          name: "딘커우 사당 · 선셋",
          location: { lat: 10.2223, lng: 103.9576 },
          timeStartMin: 1020,
          timeEndMin: 1110,
        },
        {
          kind: "meal",
          name: "푸꾸옥 야시장 해산물",
          location: { lat: 10.222, lng: 103.958 },
          timeStartMin: 1140,
          timeEndMin: 1290,
          costVnd: 400000,
        },
      ],
    },
    {
      label: "DAY 2 · 북부 사파리 & 빈원더",
      items: [
        {
          kind: "activity",
          name: "북부 리조트 존 이동",
          location: { lat: 10.222, lng: 103.959 },
          timeStartMin: 450,
          timeEndMin: 510,
          costVnd: 300000,
        },
        {
          kind: "spot",
          name: "Vinpearl Safari",
          location: { lat: 10.3371, lng: 103.8909 },
          timeStartMin: 540,
          timeEndMin: 720,
          costVnd: 650000,
        },
        {
          kind: "meal",
          name: "사파리/리조트 존 점심",
          location: { lat: 10.335, lng: 103.897 },
          timeStartMin: 720,
          timeEndMin: 780,
          costVnd: 200000,
        },
        {
          kind: "spot",
          name: "VinWonders 테마파크",
          location: { lat: 10.323, lng: 103.896 },
          timeStartMin: 780,
          timeEndMin: 1080,
          costVnd: 950000,
        },
        {
          kind: "spot",
          name: "Grand World 야경 & 쇼",
          location: { lat: 10.36, lng: 103.855 },
          timeStartMin: 1080,
          timeEndMin: 1290,
          costVnd: 300000,
        },
      ],
    },
    {
      label: "DAY 3 · 카페 & 출국",
      items: [
        {
          kind: "spot",
          name: "카페·수영 / 여유로운 아침",
          location: { lat: 10.222, lng: 103.959 },
          timeStartMin: 540,
          timeEndMin: 660,
          costVnd: 150000,
        },
        {
          kind: "activity",
          name: "체크아웃 · 공항 이동",
          location: { lat: 10.222, lng: 103.959 },
          timeStartMin: 720,
          timeEndMin: 810,
          costVnd: 200000,
        },
        {
          kind: "activity",
          name: "푸꾸옥 공항 출발",
          location: { lat: 10.227, lng: 103.967 },
          timeStartMin: 900,
          timeEndMin: 930,
        },
      ],
    },
  ],
};

export default tpl;
