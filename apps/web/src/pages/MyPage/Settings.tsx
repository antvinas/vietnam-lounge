import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getUserProfile, updateUserProfile } from '../../api/user.api';
import { FaUserEdit } from 'react-icons/fa';

interface ProfileFormData {
  nickname: string;
  bio: string;
  avatarUrl: string;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>();

  const { data: profile, isLoading } = useQuery('userProfile', getUserProfile, {
    onSuccess: (data) => {
      setValue('nickname', data.nickname);
      setValue('bio', data.bio);
      setValue('avatarUrl', data.avatarUrl);
    }
  });

  const { mutate: update, isLoading: isUpdating } = useMutation(updateUserProfile, {
    onSuccess: () => {
      queryClient.invalidateQueries('userProfile');
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    update(data);
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FaUserEdit className="mr-3" /> Edit Profile
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center space-x-6">
                <div className="shrink-0">
                    <img 
                        className="h-24 w-24 object-cover rounded-full" 
                        src={profile?.avatarUrl || 'https://via.placeholder.com/150'} 
                        alt="Current avatar"
                    />
                </div>
                <label className="block">
                    <span className="sr-only">Choose profile photo</span>
                    <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                </label>
            </div>

            <div>
              <label htmlFor="nickname" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Nickname</label>
              <input 
                id="nickname" 
                {...register('nickname', { required: 'Nickname is required' })} 
                className="input-field"
              />
              {errors.nickname && <p className="text-red-500 text-sm mt-1">{errors.nickname.message}</p>}
            </div>

            <div>
              <label htmlFor="bio" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
              <textarea 
                id="bio" 
                {...register('bio')} 
                rows={4} 
                className="input-field"
                placeholder="Tell us a little about yourself"
              />
            </div>

            <div className="text-right">
                <button type="submit" className="btn-primary" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default Settings;
