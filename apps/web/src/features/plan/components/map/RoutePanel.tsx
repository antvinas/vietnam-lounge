// src/features/plan/components/map/RoutePanel.tsx
import React from "react";
import { usePlanStore } from "@/features/plan/stores/plan.store";

interface RoutePanelProps {
  result: google.maps.DirectionsResult | null;
}

export default function RoutePanel({ result }: RoutePanelProps) {
  // 결과가 없거나 경로가 없는 경우 렌더링하지 않음
  if (!result || !result.routes || result.routes.length === 0) {
    return null;
  }

  // Google Maps API 구조상 legs는 routes 배열의 첫 번째 요소 안에 있습니다.
  const route = result.routes[0];
  const legs = route.legs; 
  
  if (!legs || legs.length === 0) return null;

  // 전체 거리 및 시간 계산
  const totalDistance = legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
  const totalDuration = legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);

  // 미터 -> 킬로미터 변환
  const distanceInKm = (totalDistance / 1000).toFixed(1);
  
  // 초 -> 시간/분 변환
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.round((totalDuration % 3600) / 60);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
      <h3 className="font-semibold text-gray-900">경로 요약</h3>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">총 거리</span>
        <span className="font-bold text-blue-600">{distanceInKm} km</span>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">예상 시간</span>
        <span className="font-bold text-gray-900">
          {hours > 0 ? `${hours}시간 ` : ""}
          {minutes}분
        </span>
      </div>

      <div className="border-t pt-3 mt-2">
        <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase">상세 경로</h4>
        <div className="space-y-4">
          {legs.map((leg, index) => (
            <div key={index} className="text-sm">
              <div className="flex items-start gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <p className="text-gray-800">{leg.start_address.split(",")[0]}</p>
              </div>
              <div className="border-l-2 border-gray-100 ml-[3px] pl-4 py-2 my-1 space-y-1">
                <p className="text-xs text-gray-500">
                  이동: {leg.distance?.text} ({leg.duration?.text})
                </p>
              </div>
              {/* 마지막 도착지 표시 */}
              {index === legs.length - 1 && (
                <div className="flex items-start gap-2 mt-1">
                   <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                   <p className="text-gray-800">{leg.end_address.split(",")[0]}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}