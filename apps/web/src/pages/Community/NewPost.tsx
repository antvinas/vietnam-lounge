import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { FaPen, FaTag, FaFileAlt } from 'react-icons/fa';
import { createPost, getCategories, PostFormData } from '../../api/community.api';

interface NewPostProps {
  isAdult?: boolean;
}

const NewPost: React.FC<NewPostProps> = ({ isAdult = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<PostFormData, 'segment'>>();

  const segment = isAdult ? 'adult' : 'general';
  const redirectPath = isAdult ? '/adult/community' : '/community';

  const { data: categories, isLoading: isLoadingCategories } = useQuery(
    ['categories', segment], 
    () => getCategories(segment)
  );

  const { mutate: submitPost, isLoading, isError } = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['posts', segment]);
      navigate(redirectPath);
    },
  });

  const onSubmit = (data: Omit<PostFormData, 'segment'>) => {
    submitPost({ ...data, segment });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Create New Post</h1>
      {isError && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">Failed to submit the post. Please try again.</div>}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FaPen className="mr-2"/> Title
          </label>
          <input
            id="title"
            {...register('title', { required: 'Title is required.' })}
            className="input-field"
            placeholder="E.g., My amazing trip to Da Nang"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FaTag className="mr-2"/> Category
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
            <FaFileAlt className="mr-2"/> Content
          </label>
          <textarea
            id="content"
            {...register('content', { required: 'Content is required.', minLength: { value: 10, message: 'Content must be at least 10 characters long.' } })}
            rows={10}
            className="input-field"
            placeholder="Share your story, ask a question, or give a recommendation..."
          ></textarea>
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
        </div>

        <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
                {isLoading ? 'Submitting...' : 'Submit Post'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default NewPost;
