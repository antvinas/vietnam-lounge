import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';
import { getEvents, Event } from '../../api/events.api';

const EventList = () => {
  const { data: events, isLoading, isError } = useQuery('events', getEvents);

  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">Upcoming Events in Vietnam</h1>
          <p className="text-lg text-gray-600">From vibrant festivals to modern exhibitions, don't miss out.</p>
        </div>

        {isLoading && <div className="text-center text-xl">Loading events...</div>}
        {isError && <div className="text-center text-red-500 text-xl">Failed to fetch events. Please try again later.</div>}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events?.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="block group">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden transform group-hover:-translate-y-2 transition-transform duration-300">
                  <div className="relative">
                    <img src={event.imageUrl} alt={event.name} className="w-full h-56 object-cover" />
                    <div className="absolute bottom-0 left-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-tr-lg">
                      {event.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 truncate group-hover:text-blue-600">{event.name}</h3>
                    <p className="flex items-center text-gray-700 mb-2">
                      <FaCalendar className="mr-2 text-gray-500" /> {event.date}
                    </p>
                    <p className="flex items-center text-gray-700">
                      <FaMapMarkerAlt className="mr-2 text-gray-500" /> {event.location}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EventList;
