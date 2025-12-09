import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUserEdit, FaCamera, FaLock, FaTrashAlt, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { getUserProfile, updateUserProfile, uploadProfileImage, withdrawUser, UserProfileUpdateParams } from '../api/user.api';
import { useAuthStore } from '@/features/auth/stores/auth.store';

// ✅ 기본 이미지 (중성적 실루엣)
const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const Settings = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notification'>('profile');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ['userProfile'], queryFn: getUserProfile });
  const { register, handleSubmit, setValue } = useForm<UserProfileUpdateParams>();

  useEffect(() => {
    if (profile) {
      setValue('nickname', profile.nickname);
      setValue('bio', profile.bio || '');
    }
  }, [profile, setValue]);

  const profileMutation = useMutation({ 
    mutationFn: updateUserProfile, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('프로필이 저장되었습니다.');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: withdrawUser,
    onSuccess: () => {
      toast.success('회원 탈퇴가 완료되었습니다.');
      logout();
      navigate('/');
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. 로컬 미리보기
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);

    // 2. 실제 서버 업로드
    try {
      setUploading(true);
      const downloadURL = await uploadProfileImage(file);
      setValue('avatar', downloadURL); // URL을 폼 데이터에 저장
      toast.success("이미지가 업로드되었습니다. '변경사항 저장'을 눌러주세요.");
    } catch (error) {
      console.error(error);
      toast.error("이미지 업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: UserProfileUpdateParams) => {
    // 이미지를 변경하지 않았으면 기존 URL 유지
    const finalData = { ...data, avatar: data.avatar || profile?.avatar };
    profileMutation.mutate(finalData);
  };

  const handleWithdraw = () => {
    if (window.confirm("정말로 탈퇴하시겠습니까? 복구할 수 없습니다.")) {
      withdrawMutation.mutate();
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <FaUserEdit className="text-2xl text-purple-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h2>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['profile', 'security', 'notification'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveSection(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === tab 
                ? 'bg-black text-white dark:bg-white dark:text-black' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'profile' ? '프로필 편집' : tab === 'security' ? '계정 보안' : '알림 설정'}
            </button>
          ))}
        </div>
        
        {/* 1. 프로필 편집 섹션 */}
        {activeSection === 'profile' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fadeIn">
              <div className="flex flex-col items-center">
                  <div 
                    className="relative group cursor-pointer w-32 h-32"
                    onClick={() => fileInputRef.current?.click()}
                  >
                      <img 
                          src={previewImage || profile?.avatar || DEFAULT_AVATAR} 
                          alt="Avatar"
                          className={`w-full h-full rounded-full object-cover border-4 border-gray-50 dark:border-gray-700 ${uploading ? 'opacity-50' : ''}`}
                      />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaCamera className="text-white text-2xl" />
                      </div>
                  </div>
                  <span className="text-xs text-gray-400 mt-3">프로필 사진 변경</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">닉네임</label>
                  <input {...register('nickname', { required: true })} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">자기소개</label>
                  <textarea {...register('bio')} rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white resize-none" />
                </div>
              </div>

              <button type="submit" disabled={profileMutation.isPending || uploading} className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all disabled:opacity-50">
                  {profileMutation.isPending ? "저장 중..." : "변경사항 저장"}
              </button>
          </form>
        )}

        {/* 2. 계정 보안 섹션 (비밀번호/탈퇴) */}
        {activeSection === 'security' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white"><FaLock className="text-gray-400"/> 비밀번호 변경</h3>
              <input type="password" placeholder="현재 비밀번호" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white" />
              <input type="password" placeholder="새 비밀번호" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white" />
              <button className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:opacity-90">비밀번호 업데이트</button>
            </div>
            <hr className="border-gray-200 dark:border-gray-700" />
            <div className="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <h3 className="text-red-600 dark:text-red-400 font-bold flex items-center gap-2 mb-2">
                <FaExclamationTriangle /> 계정 삭제
              </h3>
              <button onClick={handleWithdraw} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors">
                <FaTrashAlt /> 회원 탈퇴하기
              </button>
            </div>
          </div>
        )}

        {/* 3. 알림 설정 */}
        {activeSection === 'notification' && (
          <div className="space-y-6 animate-fadeIn">
             <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white"><FaBell className="text-yellow-500"/> 알림 설정</h3>
             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
               <div>
                 <p className="font-bold text-gray-900 dark:text-white">마케팅 정보 수신</p>
                 <p className="text-xs text-gray-500">이벤트 및 할인 쿠폰 정보를 받습니다.</p>
               </div>
               <input type="checkbox" className="w-5 h-5 accent-purple-600" defaultChecked />
             </div>
          </div>
        )}
    </div>
  );
};

export default Settings;