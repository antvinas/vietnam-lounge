import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/admin.api';
import { FaUsers, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';

const AdminDashboard = () => {
  const { data: stats } = useQuery({ queryKey: ['adminStats'], queryFn: getDashboardStats });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Admin Dashboard</h1>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 rounded-full bg-blue-100 text-blue-600"><FaUsers size={24}/></div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <h3 className="text-2xl font-bold dark:text-white">{stats?.userCount || 0}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 rounded-full bg-green-100 text-green-600"><FaMapMarkerAlt size={24}/></div>
          <div>
            <p className="text-sm text-gray-500">Active Spots</p>
            <h3 className="text-2xl font-bold dark:text-white">{stats?.spotCount || 0}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-4 rounded-full bg-purple-100 text-purple-600"><FaCalendarAlt size={24}/></div>
          <div>
            <p className="text-sm text-gray-500">Events</p>
            <h3 className="text-2xl font-bold dark:text-white">{stats?.eventCount || 0}</h3>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 dark:text-white">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Manage Spots */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Manage Spots</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Add, edit, or remove tourist spots.</p>
          <div className="flex flex-col gap-2">
            <Link to="/admin/spots" className="text-blue-500 hover:text-blue-700 font-medium">View All Spots &rarr;</Link>
            <Link to="/admin/add-spot" className="text-green-500 hover:text-green-700 font-medium">+ Add Day Spot</Link>
          </div>
        </div>

        {/* Manage Nightlife */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Manage Nightlife</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Clubs, Bars, Karaoke management.</p>
          <div className="flex flex-col gap-2">
             <Link to="/admin/spots" className="text-blue-500 hover:text-blue-700 font-medium">View All &rarr;</Link>
             <Link to="/admin/add-nightlife" className="text-purple-500 hover:text-purple-700 font-medium">+ Add Night Spot</Link>
          </div>
        </div>

        {/* Manage Events */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Manage Events</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Add, edit, or remove upcoming events.</p>
          <div className="flex flex-col gap-2">
            <Link to="/admin/events" className="text-blue-500 hover:text-blue-700 font-medium">View Events &rarr;</Link>
            <Link to="/admin/add-event" className="text-green-500 hover:text-green-700 font-medium">+ Add Event</Link>
          </div>
        </div>

        {/* Manage Users */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Manage Users</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage user accounts, roles, and permissions.</p>
          <Link to="/admin/users" className="text-blue-500 hover:text-blue-700 font-medium">Go to User Management &rarr;</Link>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;