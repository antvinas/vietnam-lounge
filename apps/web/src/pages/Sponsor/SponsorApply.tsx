import { useState } from "react";
import { submitSponsorRequest } from "@/api/sponsor.api";
import toast from "react-hot-toast";

const SponsorApply = () => {
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    contactEmail: "",
    contactPhone: "",
    spotId: "",
    sponsorLevel: "banner",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitSponsorRequest(form);
      setDone(true);
      toast.success("신청이 접수되었습니다. 관리자가 검토 후 연락드립니다.");
    } catch (err) {
      console.error(err);
      toast.error("신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <h2 className="text-2xl font-bold mb-3">신청 완료 🎉</h2>
        <p className="text-text-secondary">
          관리자 검토 후 승인 시 등록하신 연락처로 안내드리겠습니다.
        </p>
      </div>
    );

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">내 매장 홍보 신청</h1>
      <p className="mb-8 text-sm text-text-secondary">
        아래 정보를 입력해주시면 관리자가 확인 후 등록 절차를 안내드립니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1">업체명</label>
          <input
            type="text"
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-surface p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">대표자명</label>
          <input
            type="text"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-surface p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">이메일</label>
          <input
            type="email"
            name="contactEmail"
            value={form.contactEmail}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-surface p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">전화번호</label>
          <input
            type="text"
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            placeholder="010-0000-0000"
            className="w-full rounded-lg border border-border bg-surface p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">스팟 ID (선택)</label>
          <input
            type="text"
            name="spotId"
            value={form.spotId}
            onChange={handleChange}
            placeholder="스팟 등록 시 발급된 ID"
            className="w-full rounded-lg border border-border bg-surface p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">광고 종류</label>
          <select
            name="sponsorLevel"
            value={form.sponsorLevel}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-surface p-3"
          >
            <option value="banner">프리미엄 배너</option>
            <option value="slider">협찬 슬라이더</option>
            <option value="infeed">리스트형 광고</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">추가 요청사항</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            placeholder="특이사항이나 요청 내용을 입력해주세요."
            className="w-full rounded-lg border border-border bg-surface p-3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-white hover:opacity-90 transition"
        >
          {loading ? "등록 중..." : "신청하기"}
        </button>
      </form>
    </main>
  );
};

export default SponsorApply;
