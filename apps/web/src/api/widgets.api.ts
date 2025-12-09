/**
 * 위젯 관련 API (날씨, 환율)
 * 실제 API가 없을 때를 대비해 의사 데이터 생성 로직 포함
 */

export interface WeatherSnapshot {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  updatedAt: string;
}

export interface ExchangeRateSnapshot {
  base: string;
  rates: {
    USD: number;
    VND: number;
    KRW: number;
  };
  updatedAt: string;
}

// 의도적인 지연 시뮬레이션 (로딩 테스트용)
const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 🟢 날씨 데이터 (OpenWeather 기반)
 * 오프라인에서도 동작하도록 임의 난수 기반 데이터 생성
 */
export const fetchWeather = async (
  city: string = "Ho Chi Minh City"
): Promise<WeatherSnapshot> => {
  await delay(250);
  const now = new Date();

  const hourSeed = now.getUTCHours() + now.getUTCDate();
  const baseTemp = 31;
  const tempOffset = Math.sin((hourSeed / 24) * Math.PI * 2) * 3.2;
  const humidityBase = 68;
  const humidityOffset = (now.getUTCMinutes() % 7) * 1.5;

  const temperature = baseTemp + tempOffset;
  const feelsLike = temperature + 1.2;
  const humidity = Math.min(90, Math.round(humidityBase + humidityOffset));

  const descriptionPool = ["맑음", "부분적으로 흐림", "한때 소나기"];
  const iconPool = ["01d", "02d", "10d"];
  const descriptionIndex = (now.getUTCDay() + hourSeed) % descriptionPool.length;

  return {
    name: city,
    main: {
      temp: Number(temperature.toFixed(1)),
      feels_like: Number(feelsLike.toFixed(1)),
      humidity,
    },
    weather: [
      {
        description: descriptionPool[descriptionIndex],
        icon: iconPool[descriptionIndex],
      },
    ],
    wind: {
      speed: Number((2.8 + Math.abs(Math.sin(hourSeed)) * 1.4).toFixed(1)),
    },
    updatedAt: now.toISOString(),
  };
};

/**
 * 🟢 환율 데이터 (USD 기준, VND / KRW 변환)
 * 실제 API 실패 시에도 예측 가능한 결과 제공
 */
export const fetchExchangeRates = async (): Promise<ExchangeRateSnapshot> => {
  await delay(220);
  const now = new Date();
  const daySeed = now.getUTCDate();
  const usdToVndBase = 24420;
  const usdToKrwBase = 1332.5;
  const seasonalOffset = Math.sin((daySeed / 31) * Math.PI * 2);

  const vnd = Math.round(usdToVndBase + seasonalOffset * 120);
  const krw = Number((usdToKrwBase + seasonalOffset * 4.2).toFixed(2));

  return {
    base: "USD",
    rates: {
      USD: 1,
      VND: vnd,
      KRW: krw,
    },
    updatedAt: now.toISOString(),
  };
};
