// src/pages/MyPage/MyFavorites.tsx
import { useQuery } from "@tanstack/react-query";
import { getMyFavorites, type FavoriteSpot } from "@/api/user.api";

const MyFavorites = () => {
  const { data, isLoading, isError } = useQuery<FavoriteSpot[]>({
    queryKey: ["favoriteSpots"],
    queryFn: getMyFavorites,
  });

  if (isLoading) return <div>Loading your favorites…</div>;
  if (isError) return <div>Failed to load favorites.</div>;

  const items = data ?? [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold p-6 border-b border-gray-200 dark:border-gray-700">My Favorites</h2>
      {items.length > 0 ? (
        <ul>
          {items.map((it) => (
            <li key={it.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{it.name}</h3>
                {it.address && <p className="text-gray-600 dark:text-gray-400 mt-2">{it.address}</p>}
                {it.timestamp && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(it.timestamp).toLocaleDateString()}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-6 text-center text-gray-500">You have no favorite spots yet.</p>
      )}
    </div>
  );
};

export default MyFavorites;
