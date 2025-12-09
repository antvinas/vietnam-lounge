import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addSpot } from '../api/admin.api'; // 통합된 api 사용
import toast from 'react-hot-toast';

const AddNightlife = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('club');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImageFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addSpot({
        name,
        description,
        address,
        category,
        isAdult: true, // ✅ Nightlife Spot
        region: "남부", // 기본값 (필요시 입력창 추가)
        city: "호치민" // 기본값
      }, imageFiles);

      toast.success("🌙 나이트라이프 스팟 등록 완료!");
      navigate('/admin/spots');
    } catch (err) {
      console.error(err);
      toast.error('등록 실패. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">Add Nightlife Spot</h1>
      <div className="bg-gray-900 text-white shadow-lg rounded-lg p-6 border border-purple-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 font-medium mb-2">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" required />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" required />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" required />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none">
              <option value="club">Club</option>
              <option value="bar">Bar</option>
              <option value="karaoke">Karaoke</option>
              <option value="massage">Massage</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Images</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-300" />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Uploading...' : 'Add Night Spot'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddNightlife;