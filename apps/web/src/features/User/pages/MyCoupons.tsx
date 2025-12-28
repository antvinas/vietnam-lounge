import { useQuery } from "@tanstack/react-query";
import { FaTicketAlt, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";

// 쿠폰 타입 정의 (API에 없으면 여기서 정의)
interface Coupon {
  id: string;
  title: string;
  description: string;
  expiryDate: string;
  isUsed: boolean;
  type: "discount" | "free" | "vip";
}

// 쿠폰 목록 가져오기 (Mock API 사용)
const fetchMyCoupons = async (): Promise<Coupon[]> => {
  // 실제 API가 준비되면: const { data } = await api.get("/users/me/coupons"); return data;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "c1",
          title: "웰컴 쿠폰",
          description: "첫 가입 기념 10% 할인",
          expiryDate: "2024-12-31",
          isUsed: false,
          type: "discount",
        },
        {
          id: "c2",
          title: "VIP 라운지 입장권",
          description: "무료 음료 1잔 포함",
          expiryDate: "2024-10-15",
          isUsed: true,
          type: "free",
        },
      ]);
    }, 500);
  });
};

const MyCoupons = () => {
  const { data: coupons = [], isLoading, isError } = useQuery({
    queryKey: ["myCoupons"],
    queryFn: fetchMyCoupons,
  });

  if (isLoading) return <div className="p-20 text-center text-gray-500">쿠폰을 불러오는 중입니다…</div>;
  if (isError)
    return (
      <div className="p-20 text-center text-gray-500">
        <FaExclamationTriangle className="inline mr-1" /> 쿠폰 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-20">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
        <FaTicketAlt className="text-purple-500" /> 내 쿠폰
      </h2>

      {coupons.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-6 rounded-2xl border flex flex-col transition-all ${
                coupon.isUsed
                  ? "bg-gray-100 dark:bg-gray-800/50 opacity-60 border-transparent"
                  : "bg-white dark:bg-gray-800 border-purple-100 dark:border-gray-700 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
                    coupon.type === "free" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {coupon.type === "free" ? "FREE" : "DISCOUNT"}
                </span>
                {coupon.isUsed && <FaCheckCircle className="text-gray-400" />}
              </div>

              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{coupon.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{coupon.description}</p>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs font-medium text-gray-400">
                <span className="flex items-center gap-1">
                  <FaClock /> 유효기간: {coupon.expiryDate}
                </span>
                {coupon.isUsed ? <span>사용 완료</span> : <span className="text-purple-600">사용 가능</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
          <FaTicketAlt className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-700 dark:text-gray-200 font-bold">보유한 쿠폰이 없습니다.</p>
          <p className="mt-1 text-sm text-gray-500">이벤트/프로모션에서 쿠폰을 받을 수 있어요.</p>
          <Link
            to="/events"
            className="mt-5 inline-flex items-center justify-center px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
          >
            이벤트 확인하기
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyCoupons;
