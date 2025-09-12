import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getPosts, Post } from '../../api/posts.api';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const BlogHome = () => {
  const { data: posts, isLoading, isError } = useQuery('posts', getPosts);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900">Travel Stories</h1>
          <p className="text-xl text-gray-600 mt-4">Inspiration for your next adventure in Vietnam.</p>
        </div>

        {isLoading && <div className="text-center">Loading posts...</div>}
        {isError && <div className="text-center text-red-500">Failed to load posts.</div>}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts?.map(post => (
              <Link to={`/blog/${post.id}`} key={post.id} className="block group">
                <div className="bg-white rounded-lg shadow-md overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                  <img src={post.imageUrl} alt={post.title} className="w-full h-56 object-cover" />
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-primary mb-2">{post.title}</h2>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <div className="text-sm text-gray-500">By {post.author} on {post.date}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogHome;
