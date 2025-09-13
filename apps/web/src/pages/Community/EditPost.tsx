import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { FaPen, FaTag, FaFileAlt } from 'react-icons/fa';
import { getPostById, updatePost, getCategories, Post, PostFormData } from '../../api/community.api';
import { useEffect } from 'react';

interface EditPostProps {
  isAdult?: boolean;
}

const EditPost: React.FC<EditPostProps> = ({ isAdult = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Omit<PostFormData, 'segment'>>();

  const segment = isAdult ? 'adult' : 'general';
  const redirectPath = isAdult ? `/adult/community/post/${id}` : `/community/post/${id}`;

  const { data: post, isLoading: isLoadingPost } = useQuery(
    ['post', id],
    () => id ? getPostById(id) : Promise.resolve(null),
    { enabled: !!id }
  );

  const { data: categories, isLoading: isLoadingCategories } = useQuery(
    ['categories', segment],
    () => getCategories(segment)
  );

  useEffect(() => {
    if (post) {
      reset({ title: post.title, category: post.category, content: post.content });
    }
  }, [post, reset]);

  const { mutate: editPost, isLoading, isError } = useMutation(
    (data: Omit<PostFormData, 'segment'>) => id ? updatePost(id, data) : Promise.reject('No ID'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['posts', segment]);
        queryClient.invalidateQueries(['post', id]);
        navigate(redirectPath);
      },
    }
  );

  const onSubmit = (data: Omit<PostFormData, 'segment'>) => {
    editPost(data);
  };

  if (isLoadingPost) return <div>Loading post...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Edit Post</h1>
      {isError && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">Failed to update the post. Please try again.</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FaPen className="mr-2" /> Title
          </label>
          <input
            id="title"
            {...register('title', { required: 'Title is required.' })}
            className="input-field"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FaTag className="mr-2" /> Category
          </label>
          <select
            id="category"
            {...register('category', { required: 'Category is required.' })}
            className="input-field"
            disabled={isLoadingCategories}
          >
            {isLoadingCategories ? (
              <option>Loading categories...</option>
            ) : (
              categories?.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)
            )}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="content" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FaFileAlt className="mr-2" /> Content
          </label>
          <textarea
            id="content"
            {...register('content', { required: 'Content is required.', minLength: { value: 10, message: 'Content must be at least 10 characters long.' } })}
            rows={10}
            className="input-field"
          ></textarea>
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Updating...' : 'Update Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;
