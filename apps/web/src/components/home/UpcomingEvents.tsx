import React from 'react';
import { FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import useUiStore from '@/store/ui.store';

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

// Helper function to format the date as per the feedback: YYYY. MM. DD (Day)
const formatEventDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });

  return `${year}. ${month}. ${day} (${weekday})`;
};

// The EventCard now uses our theme system for colors, shadows, and consistency.
const EventCard = ({ event }: { event: Event }) => {
  const { contentMode } = useUiStore();
  const buttonColor = contentMode === 'explorer' ? 'bg-primary' : 'bg-accent';

  return (
    <div className="bg-surface rounded-xl shadow-subtle motion-safe:transition-shadow motion-safe:duration-240 motion-safe:hover:shadow-lifted flex items-center space-x-4 p-4">
      <img src={`${event.imageUrl}&q=80&auto=format`} alt={event.name} className="w-24 h-24 object-cover rounded-lg" />
      <div className="flex-1">
        <h3 className="font-bold text-lg text-text-main mb-2">{event.name}</h3>
        <div className="flex items-center text-sm text-text-secondary mb-1.5">
          <FaCalendarAlt className="mr-2 text-accent flex-shrink-0" />
          {/* Date is now formatted correctly */}
          <span>{formatEventDate(event.date)}</span>
        </div>
        <div className="flex items-center text-sm text-text-secondary">
          <FaMapMarkerAlt className="mr-2 text-accent flex-shrink-0" />
          <span>{event.location}</span>
        </div>
      </div>
      {/* Detail button color now reflects the current mode */}
      <button className={`${buttonColor} text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap`}>
        상세보기
      </button>
    </div>
  );
};

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  return (
    <section className="py-16">
      <div className="text-center mb-10">
        <h2 className="text-h2 text-text-main">📅 Upcoming Events</h2>
        <p className="text-body text-text-secondary mt-2 max-w-2xl mx-auto">베트남에서 열리는 흥미로운 이벤트를 놓치지 마세요!</p>
      </div>
      <div className="space-y-6 max-w-4xl mx-auto">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
};

export default UpcomingEvents;
