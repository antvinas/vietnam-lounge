import { useQuery } from "@tanstack/react-query";
import { FaTicketAlt, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
// ✅ [수정] 경로 수정 (../../ -> ../)
import { getMyCoupons, Coupon } from "../api/user.api";

const MyCoupons = () => {
  const { data: coupons, isLoading, isError } = useQuery<Coupon[]>({
    queryKey: ["myCoupons"],
    queryFn: getMyCoupons,
  });

  if (isLoading) return <div className="p-8 text-center">Loading coupons...</div>;
  if (isError) return <div className="p-8 text-center text-red-500"><FaExclamationTriangle className="inline mr-2"/>로드 실패</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <FaTicketAlt className="text-purple-500" /> 내 쿠폰함
      </h2>

      {coupons && coupons.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((coupon) => (
            <div key={coupon.id} className={`p-5 rounded-xl border flex flex-col ${coupon.isUsed ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-900 border-purple-200 dark:border-gray-700'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${coupon.type === 'free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {coupon.type}
                </span>
                {coupon.isUsed && <FaCheckCircle className="text-gray-400" />}
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">{coupon.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-1">{coupon.description}</p>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-400">
                <span className="flex items-center"><FaClock className="mr-1"/> ~{coupon.expiryDate}</span>
                {!coupon.isUsed && <button className="px-3 py-1 bg-purple-600 text-white rounded font-bold hover:bg-purple-700">사용하기</button>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">보유한 쿠폰이 없습니다.</p>
      )}
    </div>
  );
};

export default MyCoupons;