import { useNavigate } from "react-router-dom";
import type { Spot } from "@/types/spot";
import { PhotoView } from "react-photo-view";
import {
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaMapMarkerAlt,
  FaShareSquare,
} from "react-icons/fa";

interface SpotHeroProps {
  spot: Spot;
  isFavorited: boolean;
  onFavoriteToggle: () => void;
  mode: "explorer" | "nightlife";
  galleryImages: string[];
}

const SpotHero = ({
  spot,
  isFavorited,
  onFavoriteToggle,
  mode,
  galleryImages,
}: SpotHeroProps) => {
  const navigate = useNavigate();
  const hasUser = true; // TODO: 실제 로그인 상태와 연동 필요

  const heroOverlayColor =
    mode === "nightlife"
      ? "from-black/80 via-black/50 to-transparent"
      : "from-black/70 via-black/40 to-transparent";

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: spot.name,
          text: `Check out ${spot.name}!`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다!");
    }
  };

  return (
    <header className="relative h-[450px] w-full overflow-hidden text-white md:h-[500px]">
      {/* Hero Image */}
      <PhotoView src={galleryImages[0]}>
        <img
          src={galleryImages[0] || spot.imageUrl}
          alt={spot.name}
          className="absolute inset-0 h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-105"
        />
      </PhotoView>

      {/* Hidden gallery images */}
      <div style={{ display: "none" }}>
        {galleryImages.slice(1).map((image, index) => (
          <PhotoView key={index} src={image}>
            <img src={image} alt="" />
          </PhotoView>
        ))}
      </div>

      {galleryImages.length === 0 && (
        <div className="absolute inset-0 h-full w-full bg-gray-200" />
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-t ${heroOverlayColor}`}
      />

      <div className="absolute inset-0 mx-auto flex max-w-screen-2xl flex-col justify-end px-4 pb-16 md:px-10 lg:px-20">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/80 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
              {spot.category}
            </span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-semibold backdrop-blur-sm">
              {spot.region}
            </span>
          </div>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.2rem)] font-extrabold leading-tight tracking-tighter">
            {spot.name}
          </h1>
          <p className="mt-2 text-lg font-semibold text-white/90">
            현재 지역: {spot.region || spot.city || "베트남"}
          </p>
          <p className="mt-3 flex items-center gap-2 text-base font-medium text-white/80 md:text-lg">
            <FaMapMarkerAlt /> {spot.address}
          </p>
        </div>
      </div>

      {/* Back button */}
      <div className="absolute left-4 top-6 z-10 md:left-6">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          aria-label="Go back"
        >
          <FaArrowLeft size={18} />
        </button>
      </div>

      {/* Action buttons */}
      {hasUser && (
        <div className="absolute right-4 top-6 z-10 flex gap-2 md:right-6">
          <button
            onClick={handleShare}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="Share spot"
          >
            <FaShareSquare size={18} />
          </button>
          <button
            onClick={onFavoriteToggle}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="Toggle favorite"
          >
            {isFavorited ? (
              <FaHeart className="text-red-500" size={20} />
            ) : (
              <FaRegHeart size={20} />
            )}
          </button>
        </div>
      )}
    </header>
  );
};

export default SpotHero;
