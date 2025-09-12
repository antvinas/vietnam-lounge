import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FaSearch, FaArrowRight, FaRegComments, FaBuilding, FaCalendarAlt } from 'react-icons/fa';
import { getPosts } from '../../api/community.api';
import { fetchFeaturedSpots } from '../../api/spots.api';
import { fetchUpcomingEvents } from '../../api/events.api';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: spots, isLoading: isLoadingSpots } = useQuery('featuredSpots', fetchFeaturedSpots);
  const { data: posts, isLoading: isLoadingPosts } = useQuery('latestPosts', () => getPosts('general').then(p => p.slice(0, 3)));
  const { data: events, isLoading: isLoadingEvents } = useQuery('upcomingEvents', fetchUpcomingEvents);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[55vh] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white p-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center animation-fadeIn">Vietnam Lounge</h1>
          <p className="text-lg md:text-2xl mb-8 text-center animation-slideUp">Your ultimate guide to the best of Vietnam, day and night.</p>
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for spots, restaurants, and more..."
                className="w-full p-4 pr-12 text-gray-900 rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-primary">
                <FaSearch size={20} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">

          {/* Featured Spots Widget */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center"><FaBuilding className="mr-3 text-primary"/>Featured Spots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoadingSpots ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card animate-pulse"><div className="h-56 bg-gray-300 dark:bg-gray-700"></div><div className="p-6"><div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/4 mb-2"></div><div className="h-6 bg-gray-300 dark:bg-gray-700 w-3/4"></div></div></div>
                ))
              ) : (
                spots?.map(spot => (
                  <div key={spot.id} className="card transform hover:-translate-y-2 transition-all duration-300">
                    <img src={spot.imageUrl} alt={spot.name} className="w-full h-56 object-cover" />
                    <div className="p-6">
                      <p className="text-sm text-primary font-semibold">{spot.category}</p>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{spot.name}</h3>
                      <Link to={`/spots/${spot.id}`} className="inline-flex items-center text-primary dark:text-purple-400 mt-4 font-semibold hover:underline">
                        Learn More <FaArrowRight className="ml-2" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Community and Events Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Latest Community Posts */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center"><FaRegComments className="mr-3 text-primary"/>Latest from Community</h2>
              <div className="space-y-4">
                {isLoadingPosts ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow animate-pulse"><div className="h-5 bg-gray-300 dark:bg-gray-700 w-5/6"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/3 mt-2"></div></div>
                  ))
                ) : (
                  posts?.map(post => (
                    <Link to={`/community/post/${post.id}`} key={post.id} className="block bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <p className="font-semibold text-gray-800 dark:text-white truncate">{post.title}</p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {post.author ? `by ${post.author}` : 'Join the conversation!'}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center"><FaCalendarAlt className="mr-3 text-primary"/>Upcoming Events</h2>
              <div className="space-y-4">
                {isLoadingEvents ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow animate-pulse"><div className="h-5 bg-gray-300 dark:bg-gray-700 w-4/6"></div><div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/2 mt-2"></div></div>
                  ))
                ) : (
                  events?.map(event => (
                    <Link to={`/events/${event.id}`} key={event.id} className="block bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                       <p className="font-semibold text-gray-800 dark:text-white">{event.name}</p>
                       <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.date}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Home;