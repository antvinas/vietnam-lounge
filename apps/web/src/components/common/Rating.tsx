
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
}

const Rating = ({ rating, maxRating = 5, size = 20 }: RatingProps) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = maxRating - fullStars - halfStar;

  return (
    <div className="flex items-center text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <FaStar key={`full-${i}`} size={size} />
      ))}
      {halfStar === 1 && <FaStarHalfAlt size={size} />}
      {[...Array(emptyStars)].map((_, i) => (
        <FaRegStar key={`empty-${i}`} size={size} />
      ))}
    </div>
  );
};

export default Rating;
