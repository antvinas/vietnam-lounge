import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPostById, getCommentsByPostId, createComment, updatePostLike, Post, Comment } from '@/api/community.api'; // Adjusted path
import { FaHeart, FaRegHeart, FaComment, FaUserCircle, FaPaperPlane } from 'react-icons/fa';
import { useAuthStore } from '@/store/auth.store'; // Adjusted path
import useUiStore from '@/store/ui.store'; // Changed from useThemeStore

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { contentMode } = useUiStore(); // Changed from mode
  const isNightlife = contentMode === 'nightlife';
  const segment = isNightlife ? 'adult' : 'general';

  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);

  // Fetch Post Details
  const { data: post, isLoading, isError } = useQuery<Post | null>({
    queryKey: ['post', id, segment], 
    queryFn: () => id ? getPostById(id, segment) : null,
    enabled: !!id,
    onSuccess: (data) => {
      if (data && user) {
        setLiked(data.likedBy?.includes(user.id) ?? false);
      }
    },
  });

  // Fetch Comments
  const { data: comments, isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: ['comments', id, segment], 
    queryFn: () => id ? getCommentsByPostId(id, segment) : [],
    enabled: !!id 
  });

  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: ({ postId, content, segment }: { postId: string; content: string; segment: string }) => 
      createComment(postId, content, segment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id, segment] });
      queryClient.invalidateQueries({ queryKey: ['post', id, segment] }); // To update commentsCount
      setNewComment('');
    },
  });

  // Mutation for toggling a like
  const toggleLikeMutation = useMutation({
    mutationFn: (postId: string) => updatePostLike(postId, segment),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['post', id, segment], updatedPost);
      if (user) {
        setLiked(updatedPost.likedBy?.includes(user.id) ?? false);
      }
    }
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && id) {
      addCommentMutation.mutate({ postId: id, content: newComment, segment });
    }
  };

  const handleLikeToggle = () => {
    if (id && user) { // Ensure user is logged in to like
      toggleLikeMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="loader"></div></div>;
  if (isError || !post) return <div className="text-center py-10 text-red-500">Post not found or failed to load.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-6 btn btn-outline">← Back to Community</button>
      <article className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">{post.title}</h1>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            <FaUserCircle className="w-8 h-8 rounded-full mr-3" />
            <div>
              <span>By {post.author}</span>
              <span className="mx-2">•</span>
              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">{post.content}</p>
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <button onClick={handleLikeToggle} disabled={!user || toggleLikeMutation.isPending} className="flex items-center gap-2 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {liked ? <FaHeart className="text-red-500"/> : <FaRegHeart />}
                <span>{post.likes} Likes</span>
              </button>
              <div className="flex items-center gap-2">
                <FaComment />
                <span>{post.commentsCount} Comments</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="mt-10">
        <h2 className="text-3xl font-bold mb-6 dark:text-white">Comments</h2>
        {user && (
          <form onSubmit={handleAddComment} className="mb-8 flex items-center gap-4">
            <FaUserCircle className="w-10 h-10 text-gray-400" />
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input-field flex-grow"
              disabled={addCommentMutation.isPending}
            />
            <button type="submit" className="btn btn-primary" disabled={addCommentMutation.isPending}>
              <FaPaperPlane />
            </button>
          </form>
        )}

        <div className="space-y-6">
          {isLoadingComments ? (
            <p className="dark:text-gray-300">Loading comments...</p>
          ) : (comments?.length ?? 0) > 0 ? (
            comments?.map(comment => (
              <div key={comment.id} className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <FaUserCircle className="w-10 h-10 text-gray-400"/>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold dark:text-white">{comment.author}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default PostDetail;
