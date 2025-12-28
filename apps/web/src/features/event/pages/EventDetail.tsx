// apps/web/src/features/evemt/pages/EventDetail.tsx

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";
import { FaArrowLeft, FaCalendar, FaMapMarkerAlt, FaTag, FaUserTie } from "react-icons/fa";
import { getEventById, Event } from "@/features/event/api/events.api";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, isError } = useQuery<Event | null, Error>({
    queryKey: ["event", eventId],
    queryFn: () => (eventId ? getEventById(eventId) : Promise.resolve(null)),
    enabled: !!eventId,
  });

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading event details...</div>;
  if (isError) return <div className="flex flex-col justify-center items-center h-screen text-red-500"><p>Failed to fetch event details.</p><Link to="/events" className="mt-4 text-blue-500">Go Back</Link></div>;
  if (!event) return <div className="flex justify-center items-center h-screen">Event not found.</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Link to="/events" className="inline-flex items-center text-blue-600 mb-6 hover:underline">
            <FaArrowLeft className="mr-2" /> Back to All Events
          </Link>
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-96 object-cover"
              loading="eager"
              decoding="async"
              sizes="100vw"
            />
            <div className="p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">{event.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 my-6 text-lg">
                <p className="flex items-center text-gray-800">
                  <FaCalendar className="mr-3 text-blue-500" /> <strong>Date:</strong>
                  <span className="ml-2 font-light">{event.date}</span>
                </p>
                <p className="flex items-center text-gray-800">
                  <FaMapMarkerAlt className="mr-3 text-blue-500" /> <strong>Location:</strong>
                  <span className="ml-2 font-light">{event.location}</span>
                </p>
                <p className="flex items-center text-gray-800">
                  <FaTag className="mr-3 text-blue-500" /> <strong>Category:</strong>
                  <span className="ml-2 font-light">{event.category}</span>
                </p>
                <p className="flex items-center text-gray-800">
                  <FaUserTie className="mr-3 text-blue-500" /> <strong>Organizer:</strong>
                  <span className="ml-2 font-light">{event.organizer}</span>
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">About the Event</h3>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>
              {event.gallery && event.gallery.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.gallery.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${event.name} gallery image ${index + 1}`}
                        className="rounded-lg object-cover h-40 w-full"
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width:1024px) 33vw, 50vw"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetail;
