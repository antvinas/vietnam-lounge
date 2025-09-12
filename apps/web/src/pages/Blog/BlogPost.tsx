import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getPostById, Post } from '../../api/posts.api';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { FaArrowLeft } from 'react-icons/fa';

const BlogPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isLoading, isError } = useQuery<Post | null, Error>(
    ['post', postId],
    () => postId ? getPostById(postId) : Promise.resolve(null),
    { enabled: !!postId }
  );

  if (isLoading) {
    return <div className="text-center py-20">Loading post...</div>;
  }

  if (isError) {
    return <div className="text-center py-20 text-red-500">Error loading post.</div>;
  }

  if (!post) {
    return <div className="text-center py-20">Post not found.</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center text-primary hover:underline mb-8">
            <FaArrowLeft className="mr-2" />
            Back to Blog
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{post.title}</h1>
          <div className="text-gray-600 mb-8">
            By <span className="font-semibold">{post.author}</span> on <span className="font-semibold">{post.date}</span>
          </div>
          <img src={post.imageUrl} alt={post.title} className="w-full rounded-lg shadow-lg mb-8" />
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
