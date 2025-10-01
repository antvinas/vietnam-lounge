import { useState } from "react";
import { CommunityCategory } from "@/types/community";
import { createPost } from "@/api/community";
import { useNavigate } from "react-router-dom";

const categories: CommunityCategory[] = ["여행이야기","동행모임","맛집후기","스파후기","Q&A","자유"];

export default function PostEditor({
  defaultValues,
  mode = "create",
}: {
  defaultValues?: Partial<{ title: string; content: string; category: CommunityCategory; region: string }>;
  mode?: "create" | "edit";
}) {
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [content, setContent] = useState(defaultValues?.content || "");
  const [category, setCategory] = useState<CommunityCategory>(defaultValues?.category || "여행이야기");
  const [region, setRegion] = useState(defaultValues?.region || "호치민");
  const [isAnon, setIsAnon] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
    setSaving(true);
    try {
      const id = await createPost({
        category,
        title,
        content,
        region,
        author: { uid: null, displayName: isAnon ? "익명" : "게스트", isAnonymous: isAnon },
      });
      navigate(`/community/post/${id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          className="border px-2 py-1 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value as CommunityCategory)}
        >
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          className="border px-2 py-1 rounded"
          placeholder="지역 (예: 호치민)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </div>

      <input
        className="w-full border p-2 rounded"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full border p-2 rounded min-h-[180px]"
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)} />
        익명으로 작성
      </label>

      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={saving}
        >
          {mode === "create" ? "등록" : "수정 저장"}
        </button>
        <button onClick={() => history.back()} className="px-4 py-2 rounded border">
          취소
        </button>
      </div>
    </div>
  );
}
