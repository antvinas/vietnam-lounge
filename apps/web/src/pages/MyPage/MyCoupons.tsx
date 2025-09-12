import { useQuery } from 'react-query';
import { getMyCoupons } from '../../api/user.api';
import { FaTicketAlt, FaInfoCircle } from 'react-icons/fa';

const MyCoupons = () => {
  const { data: coupons, isLoading, isError } = useQuery('myCoupons', getMyCoupons);

  if (isLoading) return <div>Loading your coupons...</div>;
  if (isError) return <div>Failed to load coupons.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold p-6 border-b border-gray-200 dark:border-gray-700">My Coupons</h2>
      {coupons && coupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {coupons.map(coupon => (
            <div key={coupon.id} className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <div className="p-5">
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center"><FaTicketAlt className="mr-2" />{coupon.name}</h3>
                      <span className="font-semibold text-lg">{coupon.discount}</span>
                  </div>
                  <p className="text-sm opacity-80 mt-3">Valid until: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-white/10 p-3 text-xs flex items-center">
                  <FaInfoCircle className="mr-2" />
                  <span>{coupon.description}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-10 text-center text-gray-500">You don't have any coupons right now.</p>
      )}
    </div>
  );
};

export default MyCoupons;
