import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card for adding a spot */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Manage Spots</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Add, edit, or remove tourist spots.</p>
          <Link 
            to="/admin/add-spot"
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            Add New Spot &rarr;
          </Link>
        </div>

        {/* Card for adding an event */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Manage Events</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Add, edit, or remove upcoming events.</p>
          <Link 
            to="/admin/add-event"
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            Add New Event &rarr;
          </Link>
        </div>

        {/* Card for adding a nightlife spot */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Manage Nightlife</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Add, edit, or remove nightlife locations.</p>
          <Link 
            to="/admin/add-nightlife"
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            Add New Nightlife Spot &rarr;
          </Link>
        </div>

        {/* Card for managing users */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Manage Users</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage user accounts, roles, and permissions.</p>
          <Link 
            to="/admin/manage-users"
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            Go to User Management &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
