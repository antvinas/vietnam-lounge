import { useState } from "react";
import Header from "@/layout/Header";
import Footer from "@/layout/Footer";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { FaUserEdit, FaBookmark, FaClipboardList, FaCog } from "react-icons/fa";
import { Navigate } from "react-router-dom";

const Profile = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "bookmarks" | "posts" | "settings">("overview");

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <h2 className="text-2xl font-semibold">Profile Overview</h2>
            <p>Welcome, {user?.username}!</p>
          </div>
        );
      case "bookmarks":
        return (
          <div>
            <h2 className="text-2xl font-semibold">My Bookmarks</h2>
            <p>You have no saved items.</p>
          </div>
        );
      case "posts":
        return (
          <div>
            <h2 className="text-2xl font-semibold">My Posts</h2>
            <p>You have not created any posts.</p>
          </div>
        );
      case "settings":
        return (
          <div>
            <h2 className="text-2xl font-semibold">Account Settings</h2>
            <p>Edit your profile details here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-6xl mx-auto md:flex">
          {/* Left Sidebar */}
          <aside className="w-full md:w-1/4 lg:w-1/5 pr-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-center">
              <img
                src={
                  (user as any)?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.username || "U")}`
                }
                alt="User Avatar"
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-blue-500 object-cover"
                loading="lazy"
                decoding="async"
                sizes="128px"
              />
              <h2 className="text-2xl font-bold dark:text-white">{user?.username}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              <button
                className="mt-4 w-full flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                type="button"
              >
                <FaUserEdit className="mr-2" /> Edit Profile
              </button>
            </div>

            <nav className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`flex w-full items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      activeTab === "overview" ? "bg-blue-100 dark:bg-blue-900" : ""
                    }`}
                    aria-pressed={activeTab === "overview"}
                  >
                    <FaUserEdit className="mr-3" /> Overview
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("bookmarks")}
                    className={`flex w-full items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      activeTab === "bookmarks" ? "bg-blue-100 dark:bg-blue-900" : ""
                    }`}
                    aria-pressed={activeTab === "bookmarks"}
                  >
                    <FaBookmark className="mr-3" /> My Bookmarks
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className={`flex w-full items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      activeTab === "posts" ? "bg-blue-100 dark:bg-blue-900" : ""
                    }`}
                    aria-pressed={activeTab === "posts"}
                  >
                    <FaClipboardList className="mr-3" /> My Posts
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex w-full items-center p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      activeTab === "settings" ? "bg-blue-100 dark:bg-blue-900" : ""
                    }`}
                    aria-pressed={activeTab === "settings"}
                  >
                    <FaCog className="mr-3" /> Settings
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <div className="w-full md:w-3/4 lg:w-4/5 mt-8 md:mt-0">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">{renderContent()}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
