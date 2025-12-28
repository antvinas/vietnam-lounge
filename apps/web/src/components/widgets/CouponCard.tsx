import { FaDownload, FaShare } from "react-icons/fa";

type CouponShape = {
  title: string;
  description?: string;
  partnerName?: string;
  partnerLogo?: string;
  discount?: string;
  ctaUrl?: string;
};

type Props =
  | { coupon: CouponShape; title?: never; description?: never; partnerName?: never; partnerLogo?: never; discount?: never }
  | { coupon?: never; title: string; description: string; partnerName: string; partnerLogo: string; discount: string };

export default function CouponCard(props: Props) {
  const c = (props as any).coupon || props;
  const title: string = c.title;
  const description: string = c.description || "";
  const partnerName: string = c.partnerName || "";
  const partnerLogo: string | undefined = c.partnerLogo;
  const discount: string = c.discount || "";
  const ctaUrl: string | undefined = c.ctaUrl;

  return (
    <div className="my-4 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">{title}</h3>
            {description && <p className="text-sm opacity-80">{description}</p>}
          </div>
          {discount && <div className="text-4xl font-extrabold tracking-tighter">{discount}</div>}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center">
            {partnerLogo ? (
              <img
                src={partnerLogo}
                alt={`${partnerName || "파트너"} 로고`}
                loading="lazy"
                decoding="async"
                sizes="40px"
                className="mr-3 h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="mr-3 h-10 w-10 rounded-full bg-white/20" aria-hidden="true" />
            )}
            <div>
              <p className="text-xs">Provided by</p>
              <p className="font-semibold">{partnerName}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {ctaUrl && (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/20 p-2 transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
                aria-label="쿠폰 받기"
              >
                <FaDownload />
              </a>
            )}
            <button
              type="button"
              aria-label="쿠폰 공유"
              onClick={() => {
                const text = `${title} - ${discount}`;
                const url = typeof window !== "undefined" ? window.location.href : "";
                if (navigator.share) navigator.share({ title, text, url }).catch(() => {});
                else {
                  navigator.clipboard.writeText(`${text}\n${url}`);
                  alert("링크가 클립보드에 복사되었습니다.");
                }
              }}
              className="rounded-full bg-white/20 p-2 transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
            >
              <FaShare />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
