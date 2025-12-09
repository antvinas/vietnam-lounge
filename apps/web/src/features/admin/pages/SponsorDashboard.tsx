import { useEffect, useState } from "react";
import {
  fetchSponsorRequests,
  approveSponsorRequest,
  expireSponsor,
} from "@/features/Sponsor/api/sponsor.api";
import toast from "react-hot-toast";

interface Request {
  id: string;
  businessName: string;
  ownerName: string;
  contactEmail: string;
  contactPhone?: string;
  sponsorLevel: string;
  status: string;
  createdAt?: any;
}

const SponsorDashboard = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [expireDate, setExpireDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSponsorRequests();
    setRequests(data as Request[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    if (!expireDate) return toast.error("만료일을 입력해주세요.");
    await approveSponsorRequest(id, expireDate);
    toast.success("승인 완료");
    setExpireDate("");
    loadData();
  };

  const handleExpire = async (id: string) => {
    await expireSponsor(id);
    toast.success("만료 처리 완료");
    loadData();
  };

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">광고주 신청 관리</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="p-3">업체명</th>
            <th className="p-3">대표자</th>
            <th className="p-3">이메일</th>
            <th className="p-3">광고유형</th>
            <th className="p-3">상태</th>
            <th className="p-3 text-center">관리</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-border hover:bg-background-sub/50">
              <td className="p-3 font-semibold">{r.businessName}</td>
              <td className="p-3">{r.ownerName}</td>
              <td className="p-3">{r.contactEmail}</td>
              <td className="p-3">{r.sponsorLevel}</td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    r.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : r.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="p-3 text-center">
                {r.status === "pending" && (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="date"
                      value={selected === r.id ? expireDate : ""}
                      onChange={(e) => {
                        setSelected(r.id);
                        setExpireDate(e.target.value);
                      }}
                      className="rounded border border-border px-2 py-1 text-xs"
                    />
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="rounded bg-primary px-2 py-1 text-xs text-white hover:opacity-90"
                    >
                      승인
                    </button>
                  </div>
                )}
                {r.status === "approved" && (
                  <button
                    onClick={() => handleExpire(r.id)}
                    className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:opacity-90"
                  >
                    만료처리
                  </button>
                )}
              </td>
            </tr>
          ))}
          {!requests.length && (
            <tr>
              <td colSpan={6} className="py-10 text-center text-text-secondary">
                신청 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
};

export default SponsorDashboard;
