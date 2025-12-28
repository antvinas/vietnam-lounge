// apps/web/src/features/plan/data/templates/phuquoc.3n4d.ts

import type { PlanTemplate } from "@/types/plan.template";

const tpl: PlanTemplate = {
  meta: {
    id: "phuquoc-3n4d",
    city: "phuquoc",
    title: "푸꾸옥 3박4일 샘플",
    nights: 3,
    defaultMode: "car",
    currency: "VND",
    plannedBudgetVnd: 9000000,
    summary: "북부 사파리·빈원더 + 남부 케이블카·섬투어까지 담은 3박4일 코스",
  },
  base: {
    name: "Duong Dong 호텔",
    location: { lat: 10.222, lng: 103.959 },
  },
  days: [
    {
      label: "DAY 1 · 도착 & 듀엉동 야경",
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
          name: "Duong Dong 타운 산책",
          location: { lat: 10.2172, lng: 103.9593 },
          timeStartMin: 900,
          timeEndMin: 1020,
        },
        {
          kind: "spot",
          name: "딘커우 사당 선셋",
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
      label: "DAY 3 · 남부 케이블카 & 섬투어",
      items: [
        {
          kind: "activity",
          name: "남부 안토이/선셋타운 이동",
          location: { lat: 10.222, lng: 103.959 },
          timeStartMin: 450,
          timeEndMin: 510,
          costVnd: 300000,
        },
        {
          kind: "spot",
          name: "Hon Thom 케이블카 탑승",
          location: { lat: 10.0208, lng: 104.0176 },
          timeStartMin: 540,
          timeEndMin: 600,
        },
        {
          kind: "spot",
          name: "Hon Thom Nature Park · 워터파크",
          location: { lat: 9.99, lng: 104.05 },
          timeStartMin: 600,
          timeEndMin: 780,
          costVnd: 750000,
        },
        {
          kind: "spot",
          name: "안토이 군도 스노클링(단체투어)",
          location: { lat: 9.91, lng: 104.01 },
          timeStartMin: 810,
          timeEndMin: 990,
        },
        {
          kind: "meal",
          name: "선셋타운/안토이 해산물 저녁",
          location: { lat: 10.01, lng: 104.03 },
          timeStartMin: 1080,
          timeEndMin: 1230,
          costVnd: 400000,
        },
        {
          kind: "activity",
          name: "Duong Dong 호텔 귀환",
          location: { lat: 10.222, lng: 103.959 },
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
          name: "카페·스파 / 여유로운 아침",
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