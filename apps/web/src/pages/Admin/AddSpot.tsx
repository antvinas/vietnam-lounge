import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addSpot } from '../../api/spots.api';
import { Spot } from '../../types/spot';

const AddSpot = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!name || !description || !address) {
      setError('All fields are required.');
      setIsSubmitting(false);
      return;
    }

    const newSpot: Omit<Spot, 'id'> = { name, description, address };

    try {
      const newSpotId = await addSpot(newSpot);
      setSuccess(`Successfully added new spot with ID: ${newSpotId}`);
      // Clear form
      setName('');
      setDescription('');
      setAddress('');
      // Optional: redirect after a delay
      setTimeout(() => navigate('/admin/dashboard'), 2000);
    } catch (err) {
      setError('Failed to add spot. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Spot</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Spot Name</label>
            <input 
              type="text" 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Description</label>
            <textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="address" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Address</label>
            <input 
              type="text" 
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-right">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Add Spot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSpot;
