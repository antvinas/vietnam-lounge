import { useState } from 'react';
import Settings from './Settings';
import MyPosts from './MyPosts';
import MyFavorites from './MyFavorites';
import MyCoupons from './MyCoupons';
import { FaUser, FaPen, FaHeart, FaTicketAlt } from 'react-icons/fa';

const MyPageHome = () => {
  const [activeTab, setActiveTab] = useState('settings');

  const tabs = [
    { id: 'settings', label: 'Profile Settings', icon: <FaUser /> },
    { id: 'my-posts', label: 'My Posts', icon: <FaPen /> },
    { id: 'my-favorites', label: 'My Favorites', icon: <FaHeart /> },
    { id: 'my-coupons', label: 'My Coupons', icon: <FaTicketAlt /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return <Settings />;
      case 'my-posts':
        return <MyPosts />;
      case 'my-favorites':
        return <MyFavorites />;
      case 'my-coupons':
        return <MyCoupons />;
      default:
        return <Settings />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <ul className="space-y-2">
              {tabs.map(tab => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left font-semibold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="w-full md:w-3/4">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MyPageHome;
