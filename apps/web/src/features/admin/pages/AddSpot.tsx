import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addSpot } from "../api/admin.api"; // ✅ 수정된 api 사용
import toast from "react-hot-toast";

const AddSpot = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("호텔");
  const [region, setRegion] = useState("북부");
  const [city, setCity] = useState("하노이");
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
        region,
        city,
        isAdult: false, // ✅ Day Spot
      }, imageFiles);

      toast.success("✅ 스팟 등록 완료!");
      navigate("/admin/spots");
    } catch (err) {
      console.error(err);
      toast.error("❌ 등록 실패. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow my-10">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">새 스팟 등록 (Day)</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">이름</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">설명</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={4} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">주소</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">지역</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="북부">북부</option>
              <option value="중부">중부</option>
              <option value="남부">남부</option>
            </select>
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">도시</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="예: 하노이" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="호텔">호텔</option>
            <option value="맛집">맛집</option>
            <option value="관광지">관광지</option>
            <option value="쇼핑">쇼핑</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">이미지 (다중 선택 가능)</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-3 rounded w-full font-bold hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? "업로드 중..." : "등록하기"}
        </button>
      </form>
    </div>
  );
};

export default AddSpot;