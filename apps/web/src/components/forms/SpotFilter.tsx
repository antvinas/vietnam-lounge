import { FaSearch } from 'react-icons/fa';

const SpotFilter = () => {
  return (
    <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
      <select className="w-full md:w-auto p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        <option>All Regions</option>
        <option>Hanoi</option>
        <option>Da Nang</option>
        <option>Ho Chi Minh City</option>
      </select>
      <select className="w-full md:w-auto p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        <option>All Categories</option>
        <option>Restaurant</option>
        <option>Cafe</option>
        <option>Nightlife</option>
        <option>Landmark</option>
      </select>
      <div className="relative w-full md:flex-grow">
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full p-2 pr-10 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <FaSearch className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" />
      </div>
      <button className="w-full md:w-auto bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">Search</button>
    </div>
  );
};

export default SpotFilter;
