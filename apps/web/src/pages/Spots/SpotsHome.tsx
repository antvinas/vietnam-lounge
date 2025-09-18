import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSpots } from '../../api/spots.api';
import type { Spot } from '@/types/spot';
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa';

const SpotCard = ({ spot }: { spot: Spot }) => {
  return (
    <Link to={`/spots/${spot.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300">
        <img
          src={spot.imageUrl || 'https://via.placeholder.com/400x300'}
          alt={spot.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h3 className="text-lg font-bold">{spot.name}</h3>
          <div className="flex items-center text-sm mt-1">
            <FaMapMarkerAlt className="mr-1.5" />
            <span>{spot.region}, {spot.city}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-2 bg-yellow-400 text-gray-900 rounded-bl-lg font-bold flex items-center">
          <FaStar className="mr-1" />
          <span>{spot.rating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
};

const SpotsHome = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSpots = async () => {
      try {
        setLoading(true);
        const data = await fetchSpots();
        setSpots(data);
      } catch (err) {
        setError('Failed to fetch spots. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getSpots();
  }, []);

  if (loading) return <div className="text-center py-10">Loading spots...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8">Explore All Spots</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {spots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}
      </div>
    </div>
  );
};

export default SpotsHome;
