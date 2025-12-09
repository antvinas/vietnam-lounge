import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addEvent } from '../api/admin.api'; // ✅ api 경로 수정
import toast from 'react-hot-toast';

const AddEvent = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addEvent({ name, description, date, location });
      toast.success("이벤트 등록 성공!");
      navigate('/admin/events');
    } catch (err) {
      toast.error('등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Add Event</h1>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Event Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Date</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Add Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEvent;