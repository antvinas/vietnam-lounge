// src/features/home/components/UpcomingEvents.tsx
import React from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";
import useUiStore from "@/store/ui.store";

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  imageUrl: string;
}

interface UpcomingEventsProps {
  events: Event[];
}

// 이미지 로딩 실패 시 보여줄 플레이스홀더
const PLACEHOLDER_IMG = "https://via.placeholder.com/150/e2e8f0/94a3b8?text=Event";

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const weekday = date.toLocaleDateString("ko-KR", { weekday: "short" });
  return `${y}. ${m}. ${d} (${weekday})`;
};

const EventCard = ({ event }: { event: Event }) => {
  const { contentMode } = useUiStore();
  
  // 모드에 따른 버튼 및 호버 스타일
  const accentColor = contentMode === "explorer" ? "text-emerald-600" : "text-violet-500";
  const buttonClass = contentMode === "explorer" 
    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
    : "bg-violet-100 text-violet-700 hover:bg-violet-200";

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-surface/80 dark:shadow-none dark:hover:bg-surface">
      {/* 썸네일 이미지 (오류 처리 포함) */}
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200">
        <img
          src={`${event.imageUrl}&q=80&auto=format`}
          alt={event.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_IMG;
          }}
        />
      </div>

      {/* 텍스트 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className="mb-2 truncate text-lg font-bold text-text-main group-hover:text-primary transition-colors">
          {event.name}
        </h3>
        
        <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className={accentColor} />
            <span>{formatEventDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className={accentColor} />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </div>

      {/* 버튼 (PC에서만 보이거나, 모바일엔 화살표만) */}
      <button
        className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-full transition-colors ${buttonClass}`}
        aria-label="상세보기"
      >
        <FaArrowRight />
      </button>
    </div>
  );
};

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  return (
    <section className="py-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold text-text-main dark:text-text-main mb-3 tracking-tight">
          📅 Upcoming Events
        </h2>
        <p className="text-text-secondary dark:text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
          베트남에서 열리는 가장 핫한 축제와 이벤트를 확인하세요.
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <button className="text-sm font-semibold text-text-secondary hover:text-primary transition-colors underline underline-offset-4">
          모든 이벤트 보기 →
        </button>
      </div>
    </section>
  );
};

export default UpcomingEvents;