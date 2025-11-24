import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addSpot } from "@/api/spots.api";
import { Spot } from "@/types/spot";

const AddSpot = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("호텔");
  const [region, setRegion] = useState("북부");
  const [city, setCity] = useState("하노이");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImageFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const newSpot: Spot = {
      name,
      description,
      address,
      category,
      region,
      city,
      rating: 0,
      images: [],
    } as Spot;

    try {
      const res = await addSpot(newSpot, imageFiles);
      setMessage(`✅ 스팟이 등록되었습니다 (ID: ${res.id})`);
      setTimeout(() => navigate("/admin"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("❌ 등록 실패. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">새 스팟 등록</h1>
      {message && <div className="mb-4 text-sm text-center">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="스팟 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          placeholder="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="주소"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <div className="flex gap-3">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border p-2 rounded w-1/3"
          >
            <option value="북부">북부</option>
            <option value="중부">중부</option>
            <option value="남부">남부</option>
          </select>
          <input
            type="text"
            placeholder="도시 (예: 하노이)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border p-2 rounded w-2/3"
          />
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {isSubmitting ? "등록 중..." : "스팟 등록"}
        </button>
      </form>
    </div>
  );
};

export default AddSpot;
