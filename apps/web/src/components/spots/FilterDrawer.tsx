import { FiX } from "react-icons/fi";
import { Compass, Sun, Mountain } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeRegion: string;
  selectedCity: string;
  onSelectCity: (region: string, city: string) => void;
}

const regions = [
  {
    id: "north",
    label: "북부",
    icon: <Mountain size={18} />,
    color: "text-[#2BB6C5]",
    cities: ["하노이 (Hà Nội)", "하이퐁 (Hải Phòng)", "사파 (Sapa)", "하롱 (Hạ Long)", "닝빈 (Ninh Bình)", "하장 (Hà Giang)", "디엔비엔 (Điện Biên)"],
  },
  {
    id: "central",
    label: "중부",
    icon: <Sun size={18} />,
    color: "text-[#8B5CF6]",
    cities: ["다낭 (Đà Nẵng)", "후에 (Huế)", "호이안 (Hội An)", "냐짱 (Nha Trang)", "달랏 (Đà Lạt)", "부온마투옷 (Buôn Ma Thuột)", "퐁냐 (Phong Nha)"],
  },
  {
    id: "south",
    label: "남부",
    icon: <Compass size={18} />,
    color: "text-[#F59E0B]",
    cities: ["호치민 (Hồ Chí Minh)", "껀터 (Cần Thơ)", "붕따우 (Vũng Tàu)", "푸꾸옥 (Phú Quốc)", "무이네 (Mũi Né)", "비엔호아 (Biên Hòa)", "까마우 (Cà Mau)"],
  },
];

const FilterDrawer = ({ isOpen, onClose, activeRegion, selectedCity, onSelectCity }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-[101] m-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-surface/95 shadow-2xl dark:bg-surface/90">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-5">
          <div>
            <h2 className="text-[22px] font-semibold text-text-main">🌏 어디로 여행가시나요?</h2>
            <p className="mt-1 text-sm text-text-secondary">지역 또는 도시를 선택하거나, 전체 보기를 선택할 수 있습니다.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-lg hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
            aria-label="닫기"
          >
            <FiX />
          </button>
        </div>

        {/* All */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-3">
          <button
            onClick={() => {
              onSelectCity("all", "전체");
              onClose();
            }}
            className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            전체 보기
          </button>
          <p className="text-xs text-text-secondary">전체 지역의 모든 스팟을 볼 수 있습니다.</p>
        </div>

        {/* Lists */}
        <div className="max-h-[70vh] space-y-8 overflow-y-auto px-6 py-6">
          {regions.map((region) => (
            <div key={region.id}>
              <button
                className="mb-4 flex items-center gap-2 hover:text-primary"
                onClick={() => {
                  onSelectCity(region.id, "전체");
                  onClose();
                }}
                aria-label={`${region.label} 전체 보기`}
              >
                <span className={region.color}>{region.icon}</span>
                <h3 className="text-lg font-semibold text-text-main">{region.label} 전체 보기</h3>
              </button>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {region.cities.map((city) => {
                  const label = city.split(" ")[0];
                  const active = selectedCity === label && activeRegion === region.id;
                  return (
                    <button
                      key={city}
                      onClick={() => {
                        onSelectCity(region.id, label);
                        onClose();
                      }}
                      className={`rounded-xl border px-4 py-3 text-center font-semibold transition-all duration-150 ${
                        active
                          ? "border-primary bg-gradient-to-r from-primary/90 to-primary text-white shadow-md"
                          : "border-border text-text-main hover:bg-background-sub dark:hover:bg-surface/60"
                      }`}
                      aria-pressed={active}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
