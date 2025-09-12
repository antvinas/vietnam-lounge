import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { fetchSpots, Spot } from '../../api/spots.api';
import { FaMapMarkerAlt, FaStar, FaBuilding, FaUtensils, FaCoffee, FaTree, FaFilter, FaSortAmountDown } from 'react-icons/fa';

// Re-using components - ideally from a shared components folder
const categoryStyles: { [key: string]: { icon: JSX.Element; color: string } } = {
    Landmark: { icon: <FaMapMarkerAlt />, color: 'bg-blue-500' },
    Museum: { icon: <FaBuilding />, color: 'bg-indigo-500' },
    Restaurant: { icon: <FaUtensils />, color: 'bg-red-500' },
    Cafe: { icon: <FaCoffee />, color: 'bg-yellow-500' },
    Park: { icon: <FaTree />, color: 'bg-green-500' },
    Default: { icon: <FaMapMarkerAlt />, color: 'bg-gray-500' },
};

const SpotCard = ({ spot }: { spot: Spot }) => {
    const style = categoryStyles[spot.category] || categoryStyles.Default;
    return (
        <Link to={`/spots/${spot.id}`} className="card group">
            <div className="relative">
                <img src={spot.imageUrl} alt={spot.name} className="w-full h-56 object-cover rounded-t-lg" />
                <div className={`absolute top-0 right-0 text-white px-3 py-1 m-2 rounded-full text-sm font-semibold ${style.color}`}>
                    {spot.city}
                </div>
            </div>
            <div className="p-6">
                <div className={`flex items-center text-sm mb-2 ${style.color.replace('bg', 'text')}`}>
                    {style.icon} <span className="ml-2 font-semibold">{spot.category}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 truncate group-hover:text-primary transition-colors">{spot.name}</h3>
                <p className="text-gray-700 dark:text-gray-400 mb-4 h-14 overflow-hidden text-ellipsis">{spot.description}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span className="font-bold text-lg dark:text-white">{spot.rating.toFixed(1)}</span>
                    </div>
                    <span className="font-semibold text-primary dark:text-purple-400">View Details</span>
                </div>
            </div>
        </Link>
    );
};

const SpotCardSkeleton = () => (
    <div className="card animate-pulse">
        <div className="h-56 bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div>
        <div className="p-6">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/4 mb-4 rounded"></div>
            <div className="h-7 bg-gray-300 dark:bg-gray-700 w-3/4 mb-3 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 w-full mb-1 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 w-5/6 rounded"></div>
            <div className="flex items-center justify-between mt-4">
                <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-5 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
    </div>
);

const City = () => {
    const { cityName } = useParams<{ cityName: string }>();
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortBy, setSortBy] = useState('rating');

    const { data: spots, isLoading, isError } = useQuery('spots', fetchSpots);

    const filteredAndSortedSpots = useMemo(() => {
        if (!spots) return [];
        return spots
            .filter(spot => spot.city === cityName)
            .filter(spot => filterCategory === 'All' || spot.category === filterCategory)
            .sort((a, b) => {
                if (sortBy === 'rating') return b.rating - a.rating;
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                return 0;
            });
    }, [spots, cityName, filterCategory, sortBy]);

    const categories = useMemo(() => {
        if (!spots) return ['All'];
        const citySpots = spots.filter(s => s.city === cityName);
        return ['All', ...new Set(citySpots.map(s => s.category))];
    }, [spots, cityName]);

    if (isError) return <div className="text-center py-10 text-red-500">Failed to load spots for this city.</div>;

    return (
        <main className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">Explore {cityName}</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">Discover the best spots in {cityName}.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8 flex justify-center items-center gap-4">
                <FaFilter className="text-gray-600 dark:text-gray-300"/>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field">
                    {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                </select>
                <FaSortAmountDown className="text-gray-600 dark:text-gray-300 ml-4"/>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field">
                    <option value="rating">Sort by Rating</option>
                    <option value="name">Sort by Name</option>
                </select>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => <SpotCardSkeleton key={i} />)}
                </div>
            ) : filteredAndSortedSpots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAndSortedSpots.map(spot => <SpotCard key={spot.id} spot={spot} />)}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-xl text-gray-500">No spots found in {cityName} with the selected filters.</p>
                </div>
            )}
        </main>
    );
};

export default City;
