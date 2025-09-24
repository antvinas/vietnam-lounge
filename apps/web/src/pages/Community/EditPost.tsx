import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaPen, FaTag, FaFileAlt } from 'react-icons/fa';
import { getPostById, updatePost, getCategories, PostFormData, Post, Category } from '@/api/community.api'; // Adjusted path
import { useEffect } from 'react';
import useUiStore from '@/store/ui.store'; // Changed from useThemeStore

const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contentMode } = useUiStore(); // Changed from mode
  const isNightlife = contentMode === 'nightlife';
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Omit<PostFormData, 'segment'>>();

  const segment = isNightlife ? 'adult' : 'general';
  // Redirect path is now based on the dynamic contentMode
  const redirectPath = `/${contentMode}/community/post/${id}`;

  const { data: post, isLoading: isLoadingPost } = useQuery<Post | null>({
    queryKey: ['post', id, segment],
    queryFn: () => id ? getPostById(id, segment) : null,
    enabled: !!id 
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories', segment],
    queryFn: () => getCategories(segment)
  });

  useEffect(() => {
    if (post) {
      reset({ title: post.title, category: post.category, content: post.content });
    }
  }, [post, reset]);

  const { mutate: editPost, isPending, isError } = useMutation({
    mutationFn: (formData: Omit<PostFormData, 'segment'>) => {
        if (!id) return Promise.reject('Post ID not found');
        return updatePost(id, { ...formData, segment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', segment] });
      queryClient.invalidateQueries({ queryKey: ['post', id, segment] });
      navigate(redirectPath);
    },
  });

  const onSubmit = (data: Omit<PostFormData, 'segment'>) => {
    editPost(data);
  };

  if (isLoadingPost) return <div className="container mx-auto px-4 py-8 text-center">Loading post...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
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
                <button type="submit" disabled={isPending} className="btn btn-primary">
                    {isPending ? 'Updating...' : 'Update Post'}
                </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default EditPost;
