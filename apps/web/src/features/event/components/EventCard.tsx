import { Link } from "react-router-dom";
import { Event } from "@/types/event";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link 
      to={`/events/${event.id}`} 
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {event.category}
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{event.date}</span>
          <span>{event.location}</span>
        </div>
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-purple-400">
          {event.name}
        </h3>
        <div className="mt-auto pt-4">
          <span className="text-sm font-medium text-blue-600 dark:text-purple-400">
            상세보기 →
          </span>
        </div>
      </div>
    </Link>
  );
}