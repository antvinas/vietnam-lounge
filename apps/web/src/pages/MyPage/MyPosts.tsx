import { useQuery } from 'react-query';
import { getMyPosts } from '../../api/user.api';
import { Link } from 'react-router-dom';
import { FaEye, FaThumbsUp, FaComment } from 'react-icons/fa';

const MyPosts = () => {
  const { data: posts, isLoading, isError } = useQuery('myPosts', getMyPosts);

  if (isLoading) return <div>Loading your posts...</div>;
  if (isError) return <div>Failed to load posts.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold p-6 border-b border-gray-200 dark:border-gray-700">My Posts</h2>
      {posts && posts.length > 0 ? (
        <ul>
          {posts.map(post => (
            <li key={post.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <Link to={`/community/post/${post.id}`} className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{post.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 truncate">{post.content}</p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-4 space-x-4">
                        <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                        <span className="flex items-center"><FaEye className="mr-1" /> {post.viewCount}</span>
                        <span className="flex items-center"><FaThumbsUp className="mr-1" /> {post.likes}</span>
                        <span className="flex items-center"><FaComment className="mr-1" /> {post.commentsCount}</span>
                    </div>
                </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-6 text-center text-gray-500">You haven't posted anything yet.</p>
      )}
    </div>
  );
};

export default MyPosts;
