import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FaExclamationTriangle,
  FaClock,
  FaChartLine,
  FaMousePointer,
  FaEye,
  FaSyncAlt,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";
import { getExpiringSponsors } from "../api/admin.api";
import {
  fetchSponsorRequests,
  approveSponsorRequest,
  expireSponsor,
  fetchSponsorStats,
} from "@/features/Sponsor/api/sponsor.api";
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Bar,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";

interface RequestRow {
  id: string;
  businessName: string;
  ownerName: string;
  contactEmail: string;
  sponsorLevel: string;
  status: "pending" | "approved" | "expired" | string;
}

interface StatData {
  date: string;
  impressions: number;
  clicks: number;
}

type PresetDays = 7 | 30 | 90;

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function SponsorDashboard() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expireDate, setExpireDate] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, expData, statsData] = await Promise.all([
        fetchSponsorRequests(),
        getExpiringSponsors(),
        fetchSponsorStats(30),
      ]);

      setRequests((reqData || []) as RequestRow[]);
      setExpiring((expData || []) as any[]);
      setStats((statsData || []) as StatData[]);
    } catch (error) {
      console.error(error);
      toast.error("데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    const totalImpressions = stats.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const totalClicks = stats.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
    return { totalImpressions, totalClicks, ctr };
  }, [stats]);

  const applyPreset = (days: PresetDays, id: string) => {
    setSelectedId(id);
    setExpireDate(addDaysISO(days));
  };

  const handleApprove = async (id: string) => {
    if (!expireDate) return toast.error("만료일을 설정해주세요");
    try {
      await approveSponsorRequest(id, expireDate);
      toast.success("승인 완료");
      setSelectedId(null);
      setExpireDate("");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("승인 실패");
    }
  };

  const handleExpire = async (id: string) => {
    if (!window.confirm("정말 강제 종료하시겠습니까?")) return;
    try {
      await expireSponsor(id);
      toast.success("종료 처리됨");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("처리 실패");
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">광고주(Sponsor) 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">승인/운영/만료/성과를 한 화면에서 관리합니다.</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <FaSyncAlt />
          새로고침
        </button>
      </div>

      {/* 성과 그래프 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FaChartLine className="text-blue-500 text-xl" />
            <h2 className="text-lg font-bold text-gray-800">광고 성과 (최근 30일)</h2>
          </div>

          <div className="flex gap-3 text-sm flex-wrap">
            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full text-blue-700">
              <FaEye /> 노출: <span className="font-bold">{totals.totalImpressions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full text-green-700">
              <FaMousePointer /> 클릭: <span className="font-bold">{totals.totalClicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full text-purple-700">
              <span>CTR:</span> <span className="font-bold">{totals.ctr}%</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-400">데이터 로딩 중...</div>
          ) : stats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded">
              집계된 광고 데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 12, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "노출수", angle: -90, position: "insideLeft", fill: "#888", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "클릭수", angle: 90, position: "insideRight", fill: "#888", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="impressions" name="노출수" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="clicks" name="클릭수" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 만료 임박 경고 */}
      {expiring.length > 0 && (
        <section className="bg-orange-50 p-4 rounded-lg border border-orange-200 animate-fade-in">
          <h3 className="flex items-center gap-2 font-bold text-orange-800 mb-2">
            <FaExclamationTriangle /> 만료 임박 광고 (7일) <span className="ml-1">({expiring.length}건)</span>
          </h3>
          <ul className="space-y-1 text-sm text-orange-700">
            {expiring.slice(0, 8).map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span className="truncate">• {s.name || s.businessName || s.title || s.id} ({s.sponsorLevel || "-"})</span>
                <span className="font-mono whitespace-nowrap">~{s.sponsorExpiry || "-"} 만료</span>
              </li>
            ))}
          </ul>
          {expiring.length > 8 && (
            <div className="text-xs text-orange-600 mt-2">…외 {expiring.length - 8}건</div>
          )}
        </section>
      )}

      {/* 요약 카드 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-800 flex items-center gap-2">
              <FaClock className="text-gray-400" /> 승인 대기
            </div>
            <div className="text-2xl font-bold text-blue-600">{pending.length}</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">만료일 설정 후 승인하세요.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-800 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" /> 운영 중
            </div>
            <div className="text-2xl font-bold text-green-600">{approved.length}</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">필요 시 강제 종료할 수 있습니다.</p>
        </div>
      </section>

      {/* 신청/운영 테이블 */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <FaClock className="text-gray-400" /> 승인 대기 / 관리 목록
          </h2>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3">업체명</th>
              <th className="px-6 py-3">대표자</th>
              <th className="px-6 py-3">레벨</th>
              <th className="px-6 py-3">상태</th>
              <th className="px-6 py-3">관리</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {requests.map((r) => {
              const isSelected = selectedId === r.id;

              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{r.businessName}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {r.ownerName}
                    <div className="text-xs text-gray-400">{r.contactEmail}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold
                        ${r.sponsorLevel === "platinum"
                          ? "bg-purple-100 text-purple-700"
                          : r.sponsorLevel === "gold"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      {String(r.sponsorLevel || "").toUpperCase()}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold
                        ${r.status === "pending"
                          ? "bg-blue-100 text-blue-700"
                          : r.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      {r.status === "pending" ? "승인 대기" : r.status === "approved" ? "광고 중" : "종료됨"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {r.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={isSelected ? expireDate : ""}
                            onChange={(e) => {
                              setSelectedId(r.id);
                              setExpireDate(e.target.value);
                            }}
                            className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                          />

                          <button
                            onClick={() => handleApprove(r.id)}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 font-bold transition shadow-sm"
                          >
                            승인
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => applyPreset(7, r.id)}
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            +7일
                          </button>
                          <button
                            onClick={() => applyPreset(30, r.id)}
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            +30일
                          </button>
                          <button
                            onClick={() => applyPreset(90, r.id)}
                            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            +90일
                          </button>
                        </div>
                      </div>
                    )}

                    {r.status === "approved" && (
                      <button
                        onClick={() => handleExpire(r.id)}
                        className="inline-flex items-center gap-2 rounded bg-red-50 text-red-600 px-3 py-1 text-xs hover:bg-red-100 border border-red-200 transition"
                      >
                        <FaBan />
                        강제 종료
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  신청 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {loading && (
          <div className="py-10 text-center text-gray-400">로딩 중...</div>
        )}
      </section>
    </main>
  );
}
