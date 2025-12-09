import { useState, useEffect } from 'react';
import { getUsers, updateUserRole, updateUserStatus, deleteUser } from '../api/admin.api';
import { User } from '../types/user'; // User 타입 경로 확인 필요
import { FaUserEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      toast.error('유저 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    await updateUserRole(userId, newRole);
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success("권한이 변경되었습니다.");
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'banned') => {
    await updateUserStatus(userId, newStatus);
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    toast.success("상태가 변경되었습니다.");
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('정말 이 유저를 삭제하시겠습니까?')) {
        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            toast.success("삭제되었습니다.");
        } catch (error) {
            toast.error("삭제 실패");
        }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">User Management</h1>
      {isLoading ? <p>Loading users...</p> : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full mr-4 object-cover" src={user.avatarUrl || "https://via.placeholder.com/40"} alt="" />
                        <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')} 
                        className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 outline-none">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <select 
                        value={user.status || 'active'}
                        onChange={(e) => handleStatusChange(user.id, e.target.value as 'active' | 'banned')} 
                        className={`px-2 py-1 rounded text-white outline-none ${user.status === 'banned' ? 'bg-red-500' : 'bg-green-500'}`}>
                      <option value="active">Active</option>
                      <option value="banned">Banned</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 p-2"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;