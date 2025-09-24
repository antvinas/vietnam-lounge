import type { Spot, Review } from "@/types/spot";
import ReviewSection from "@/components/spots/ReviewSection";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaConciergeBell,
  FaWifi,
  FaParking,
  FaSmokingBan,
  FaWheelchair,
} from "react-icons/fa";
import { MdOutlineLocalOffer } from "react-icons/md";

interface SpotMainContentProps {
  spot: Spot;
  reviews?: Review[];
  mode: "explorer" | "nightlife";
}

// 재사용 가능한 정보 아이템
const InfoItem = ({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  href?: string;
}) => {
  if (!value) return null;

  const isPlaceholder = value === "정보 없음";

  const content = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-primary hover:underline"
    >
      {value}
    </a>
  ) : (
    <span className={isPlaceholder ? "text-text-tertiary" : ""}>{value}</span>
  );

  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 text-base text-text-secondary">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-text-secondary">{label}</p>
        <div className="text-base font-medium text-text-main">{content}</div>
      </div>
    </div>
  );
};

// 편의시설 아이콘 매핑
const amenityIcons: { [key: string]: React.ReactNode } = {
  "Wi-Fi": <FaWifi />,
  주차: <FaParking />,
  금연: <FaSmokingBan />,
  "휠체어 이용 가능": <FaWheelchair />,
};

const SpotMainContent = ({ spot, reviews = [] }: SpotMainContentProps) => {
  return (
    <div className="flex flex-col gap-12">
      {/* 핵심 정보 */}
      <section
        className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        aria-labelledby="core-info-title"
      >
        <h3 id="core-info-title" className="mb-6 text-xl font-bold text-text-main">
          핵심 정보
        </h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
          <InfoItem icon={<FaMapMarkerAlt />} label="주소" value={spot.address} />
          <InfoItem
            icon={<MdOutlineLocalOffer />}
            label="카테고리"
            value={spot.category}
          />
          <InfoItem
            icon={<FaPhone />}
            label="연락처"
            value={spot.phone || "정보 없음"}
            href={spot.phone ? `tel:${spot.phone}` : undefined}
          />
          <InfoItem
            icon={<FaGlobe />}
            label="웹사이트"
            value={spot.website || "정보 없음"}
            href={spot.website}
          />
        </div>
      </section>

      {/* 상세 설명 */}
      {spot.description && (
        <section aria-labelledby="detail-info-title">
          <h3 id="detail-info-title" className="mb-4 text-xl font-bold text-text-main">
            상세 정보
          </h3>
          <p className="whitespace-pre-line text-base leading-relaxed text-text-secondary max-w-prose">
            {spot.description}
          </p>
        </section>
      )}

      {/* 태그 및 키워드 */}
      {(spot.tags?.length || spot.keywords?.length) && (
        <section aria-labelledby="tags-title">
          <h3 id="tags-title" className="mb-4 text-xl font-bold text-text-main">
            태그 및 키워드
          </h3>
          <div className="flex flex-wrap gap-3">
            {spot.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
              >
                #{tag}
              </span>
            ))}
            {spot.keywords?.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 편의시설 */}
      <section aria-labelledby="amenities-title">
        <h3 id="amenities-title" className="mb-4 text-xl font-bold text-text-main">
          편의시설 및 서비스
        </h3>
        {spot.amenities && spot.amenities.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {spot.amenities.map((amenity) => (
              <div key={amenity} className="flex items-center gap-3">
                <div className="text-lg text-primary">
                  {amenityIcons[amenity] || <FaConciergeBell />}
                </div>
                <span className="text-base font-medium text-text-main">
                  {amenity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">등록된 편의시설 정보가 없습니다.</p>
        )}
      </section>

      {/* 리뷰 */}
      <ReviewSection spotId={spot.id} reviews={reviews} />
    </div>
  );
};

export default SpotMainContent;
