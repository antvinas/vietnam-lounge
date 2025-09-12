import { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuthStore } from '../../store/auth.store';
import { FaUserEdit, FaBookmark, FaClipboardList, FaCog } from 'react-icons/fa';
import { Navigate } from 'react-router-dom';

const Profile = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isLoggedIn) {
    // Redirect to login page if not logged in
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <div><h2 className="text-2xl font-semibold">Profile Overview</h2><p>Welcome, {user?.username}!</p></div>;
      case 'bookmarks':
        return <div><h2 className="text-2xl font-semibold">My Bookmarks</h2><p>You have no saved items.</p></div>;
      case 'posts':
        return <div><h2 className="text-2xl font-semibold">My Posts</h2><p>You have not created any posts.</p></div>;
      case 'settings':
        return <div><h2 className="text-2xl font-semibold">Account Settings</h2><p>Edit your profile details here.</p></div>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-6xl mx-auto md:flex">
          {/* Left Sidebar for Profile Nav */}
          <aside className="w-full md:w-1/4 lg:w-1/5 pr-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-center">
                <img 
                    src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
                    alt="User Avatar"
                    className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-blue-500"
                />
                <h2 className="text-2xl font-bold dark:text-white">{user?.username}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <button className="mt-4 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600">
                   <FaUserEdit className="mr-2" /> Edit Profile
                </button>
            </div>
            <nav className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <ul>
                <li><a href="#" onClick={() => setActiveTab('overview')} className={`flex items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${activeTab === 'overview' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}><FaUserEdit className="mr-3" /> Overview</a></li>
                <li><a href="#" onClick={() => setActiveTab('bookmarks')} className={`flex items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${activeTab === 'bookmarks' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}><FaBookmark className="mr-3" /> My Bookmarks</a></li>
                <li><a href="#" onClick={() => setActiveTab('posts')} className={`flex items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${activeTab === 'posts' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}><FaClipboardList className="mr-3" /> My Posts</a></li>
                <li><a href="#" onClick={() => setActiveTab('settings')} className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${activeTab === 'settings' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}><FaCog className="mr-3" /> Settings</a></li>
              </ul>
            </nav>
          </aside>

          {/* Right Content Area */}
          <div className="w-full md:w-3/4 lg:w-4/5 mt-8 md:mt-0">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                {renderContent()}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
