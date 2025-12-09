import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, deleteEvent, AdminEventData } from '../api/admin.api'; // ✅ api 경로 수정
import toast from 'react-hot-toast';

const ManageEvents = () => {
  const [events, setEvents] = useState<AdminEventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      toast.error('이벤트 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('삭제하시겠습니까?')) {
      await deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
      toast.success('삭제되었습니다.');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">Manage Events</h1>
        <Link to="/admin/add-event" className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">
          + Add Event
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase">Name</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase">Date</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase">Location</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{event.name}</td>
                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{event.location}</td>
                <td className="px-5 py-4 text-sm text-right">
                  <button onClick={() => handleDelete(event.id!)} className="text-red-500 hover:text-red-700 font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageEvents;