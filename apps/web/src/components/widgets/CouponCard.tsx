
import { FaDownload, FaShare } from 'react-icons/fa';

interface CouponCardProps {
  title: string;
  description: string;
  partnerName: string;
  partnerLogo: string;
  discount: string;
}

const CouponCard = ({ title, description, partnerName, partnerLogo, discount }: CouponCardProps) => {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg overflow-hidden my-4">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-sm opacity-80">{description}</p>
          </div>
          <div className="text-4xl font-extrabold tracking-tighter">{discount}</div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center">
            <img src={partnerLogo} alt={`${partnerName} logo`} className="w-10 h-10 rounded-full mr-3" />
            <div>
              <p className="text-xs">Provided by</p>
              <p className="font-semibold">{partnerName}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
              <FaDownload />
            </button>
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
              <FaShare />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
