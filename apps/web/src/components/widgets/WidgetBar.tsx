// apps/web/src/components/widgets/WidgetBar.tsx
import { useState, useEffect } from "react";
import { Sun, RefreshCw, Clock, CloudRain, Cloud } from "lucide-react";
import { POPULAR_LOCATIONS } from "../../constants/filters";

interface Props {
  selectedLocationId: string | null;
}

const WidgetBar = ({ selectedLocationId }: Props) => {
  // 1. 위치 정보 찾기 (ID -> 한글명)
  // 선택된 지역이 없으면 기본값 '하노이' (또는 베트남 전역)
  const targetLocation = selectedLocationId 
    ? POPULAR_LOCATIONS.find(loc => loc.id === selectedLocationId) 
    : { name: "하노이", region: "north" }; // 기본값

  const locationName = targetLocation?.name || "베트남";

  // 2. 시간 상태 (베트남 시간)
  const [timeString, setTimeString] = useState("");
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // 베트남 시간대(Asia/Ho_Chi_Minh)로 강제 변환
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setTimeString(new Intl.DateTimeFormat('ko-KR', options).format(now));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000 * 60); // 1분마다 갱신
    return () => clearInterval(timer);
  }, []);

  // 3. 환율 (고정 상수 사용 - 추후 API 연동 가능)
  // 1 VND = 약 0.054 KRW (2024년 기준 대략적 수치)
  const EXCHANGE_RATE = 5.42; // 100 VND 당 원화
  const baseVND = 100000;
  const convertedKRW = (baseVND / 100 * EXCHANGE_RATE).toLocaleString();

  // 4. 날씨 (지역별 더미 데이터 - 실제로는 API 필요)
  // 지역(region)에 따라 날씨 아이콘과 기온을 다르게 보여주는 척(Mocking) 합니다.
  const getWeather = () => {
    const region = targetLocation?.region || "north";
    if (region === "south" || region === "island") {
      return { temp: "32°C", text: "무더움", icon: <Sun size={24} /> };
    } else if (region === "central") {
      return { temp: "29°C", text: "구름 조금", icon: <Cloud size={24} /> };
    } else {
      return { temp: "24°C", text: "흐림", icon: <CloudRain size={24} /> };
    }
  };
  
  const weather = getWeather();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
      <div className="flex flex-col md:flex-row items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm gap-4 md:gap-8">
        
        {/* 1. 날씨 위젯 (동적 데이터) */}
        <div className="flex items-center gap-4 flex-1 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 pb-4 md:pb-0">
          <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-full text-orange-500">
            {weather.icon}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              오늘의 날씨 ({locationName})
            </p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{weather.temp}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300 mb-0.5">{weather.text}</span>
            </div>
          </div>
        </div>

        {/* 2. 환율 위젯 (계산된 데이터) */}
        <div className="flex items-center gap-4 flex-1 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 pb-4 md:pb-0">
          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-full text-green-600">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">실시간 환율 (VND)</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{baseVND.toLocaleString()}₫</span>
              <span className="text-sm text-gray-600 dark:text-gray-300 mb-0.5">≈ {convertedKRW}원</span>
            </div>
          </div>
        </div>

        {/* 3. 시차/시간 위젯 (베트남 현지 시간) */}
        <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full text-blue-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">베트남 현지 시간</p>
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{timeString}</span>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mb-1">한국 -2시간</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WidgetBar;