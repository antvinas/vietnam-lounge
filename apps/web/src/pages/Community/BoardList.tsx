import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FaPen, FaEye, FaThumbsUp, FaChevronRight } from 'react-icons/fa';
import { getPosts } from '../../api/community.api';

interface BoardListProps {
  isAdult?: boolean;
}

const BoardList: React.FC<BoardListProps> = ({ isAdult = false }) => {
  const segment = isAdult ? 'adult' : 'general';
  const { data: posts, isLoading, error } = useQuery([
    'posts', 
    segment
  ], () => getPosts(segment));

  const pageTitle = isAdult ? "Adult Community" : "Community";
  const pageDescription = isAdult
    ? "Share your nightlife experiences and get tips from others."
    : "Share your travel experiences and get tips from fellow travelers.";
  const newPostLink = isAdult ? "/adult/community/new" : "/community/new";
  const postLinkPrefix = isAdult ? "/adult/community/post" : "/community/post";

  const SkeletonPost = () => (
    <li className="p-6 animate-pulse">
        <div className="w-full">
            <div className="flex items-center mb-3">
                <div className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded-full mr-3"></div>
                <div className="h-7 w-3/5 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="flex items-center text-sm">
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 mr-2"></div>
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mr-4"></div>
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
    </li>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">{pageTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{pageDescription}</p>
        </div>
        <Link to={newPostLink}>
          <button className="btn-primary flex items-center">
            <FaPen className="mr-2" /> New Post
          </button>
        </Link>
      </div>

      {error && <div className="text-center text-red-500 text-xl p-8">Failed to fetch posts. Please try again later.</div>}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <ul>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonPost key={i} />)
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <li key={post.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <Link to={`${postLinkPrefix}/${post.id}`} className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex-grow">
                        <div className="flex items-center mb-2">
                          {post.category && <span className="badge bg-primary/10 text-primary/80 dark:bg-purple-200 dark:text-purple-800 mr-3">{post.category}</span>}
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{post.title}</h3>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-3 space-x-4">
                           {post.avatar && <img src={post.avatar} alt={post.author} className="w-6 h-6 rounded-full"/>}
                          <span className="font-semibold">{post.author}</span>
                          <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                          <span className="flex items-center"><FaEye className="mr-1"/> {post.viewCount}</span>
                          <span className="flex items-center"><FaThumbsUp className="mr-1"/> {post.likeCount}</span>
                        </div>
                      </div>
                      <FaChevronRight className="text-gray-400 ml-4" />
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-8 text-center text-gray-500">No posts yet. Be the first to share!</li>
            )}
          </ul>
        </div>
    </div>
  );
};

export default BoardList;
