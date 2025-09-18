import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { fetchSpots, fetchAdultSpots, Spot } from '@/api/spots.api'; // Adjusted path
import useUiStore from '@/store/ui.store'; // Changed from useThemeStore
import { FaMapMarkerAlt, FaStar, FaBuilding, FaUtensils, FaCoffee, FaTree, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import MapView from '@/components/common/MapView';

const categoryStyles: { [key: string]: { icon: JSX.Element; color: string } } = {
  Landmark: { icon: <FaMapMarkerAlt />, color: 'bg-blue-500' },
  Museum: { icon: <FaBuilding />, color: 'bg-indigo-500' },
  Restaurant: { icon: <FaUtensils />, color: 'bg-red-500' },
  Cafe: { icon: <FaCoffee />, color: 'bg-yellow-500' },
  Park: { icon: <FaTree />, color: 'bg-green-500' },
  // Nightlife categories
  Club: { icon: <FaBuilding />, color: 'bg-purple-500' },
  Bar: { icon: <FaUtensils />, color: 'bg-pink-500' },
  Default: { icon: <FaMapMarkerAlt />, color: 'bg-gray-500' },
};

const SpotCard = ({ spot }: { spot: Spot }) => {
  const { contentMode } = useUiStore();
  const style = categoryStyles[spot.category] || categoryStyles.Default;
  // The link path is now directly determined by the contentMode in the parent component's logic (Header)
  const linkTo = `/${contentMode}/spots/${spot.id}`;

  return (
    <Link to={linkTo} className="card group">
      <div className="relative">
        <img src={spot.imageUrl} alt={spot.name} className="w-full h-56 object-cover rounded-t-lg" />
        <div className={`absolute top-0 right-0 text-white px-3 py-1 m-2 rounded-full text-sm font-semibold ${style.color}`}>
          {spot.region}
@@ -47,95 +48,165 @@ const SpotCard = ({ spot }: { spot: Spot }) => {
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

const SpotsHome = () => {
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' or 'name'
  const [showOpenNow, setShowOpenNow] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const { contentMode } = useUiStore();
  const isNightlife = contentMode === 'nightlife';

  const { data: spots, isLoading, isError } = useQuery(
    ['spots', isNightlife], // Query key now depends on the content mode
    isNightlife ? fetchAdultSpots : fetchSpots
  );

  const handleToggleOpenNow = () => setShowOpenNow(prev => !prev);
  const handleToggleNearby = () => setShowNearby(prev => !prev);

  const filteredAndSortedSpots = useMemo(() => {
    if (!spots) return [];
    return spots
      .filter(spot => filterRegion === 'All' || spot.region === filterRegion)
      .filter(spot => filterCategory === 'All' || spot.category === filterCategory)
      .filter(spot => {
        if (!showOpenNow) return true;
        const { isOpenNow } = spot as Spot & { isOpenNow?: boolean };
        return isOpenNow ?? true;
      })
      .filter(spot => {
        if (!showNearby) return true;
        const { isNearby } = spot as Spot & { isNearby?: boolean };
        return isNearby ?? true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [spots, filterRegion, filterCategory, sortBy, showOpenNow, showNearby]);

  const mapViewSpots = useMemo(
    () =>
      filteredAndSortedSpots.map(spot => ({
        id: spot.id,
        name: spot.name,
        location: {
          lat: spot.latitude,
          lng: spot.longitude,
        },
      })),
    [filteredAndSortedSpots]
  );

  const regions = useMemo(() => spots ? ['All', ...new Set(spots.map(s => s.region))] : ['All'], [spots]);
  const categories = useMemo(() => spots ? ['All', ...new Set(spots.map(s => s.category))] : ['All'], [spots]);
  
  // BX Copywriting change based on content mode
  const title = isNightlife ? "Explore the Nightlife" : "Explore Vietnam";
  const subtitle = isNightlife ? "Experience the vibrant nightlife of Vietnam." : "Discover the most beautiful and exciting destinations.";


  if (isError) return <div className="text-center py-10 text-red-500">Failed to load spots.</div>;

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">{subtitle}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <FaFilter className="text-gray-600 dark:text-gray-300" />
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="input-field">
              {regions.map(r => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field">
              {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <FaSortAmountDown className="text-gray-600 dark:text-gray-300" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field">
              <option value="rating">Sort by Rating</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleToggleOpenNow}
            data-active={showOpenNow}
            className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-white"
          >
            오픈나우
          </button>
          <button
            type="button"
            onClick={handleToggleNearby}
            data-active={showNearby}
            className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-white"
          >
            내 주변
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => <SpotCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedSpots.map(spot => <SpotCard key={spot.id} spot={spot} />)}
        </div>
      )}

      <section className="mt-12 space-y-6">
        <MapView spots={mapViewSpots} />
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={handleToggleOpenNow}
            data-active={showOpenNow}
            className="px-5 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-white"
          >
            오픈나우
          </button>
          <button
            type="button"
            onClick={handleToggleNearby}
            data-active={showNearby}
            className="px-5 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary data-[active=true]:bg-primary data-[active=true]:text-white"
          >
            내 주변
          </button>
        </div>
      </section>
    </main>
  );
};

export default SpotsHome;