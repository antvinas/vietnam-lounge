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

    const newSpot: Omit<Spot, 'id'> = {
      name,
      description,
      address,
      category: 'Uncategorized',
      region: 'Unassigned',
      city: 'TBD',
      operatingHours: '정보 준비 중',
      imageUrl: '',
      imageUrls: [],
      rating: 0,
      latitude: 0,
      longitude: 0,
    };

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