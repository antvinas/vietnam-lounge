// apps/web/src/lib/exchange.ts
// ECB SDMX(JSON) 기반 교차환율. 키 불필요. XML로 폴백.
/* eslint-disable @typescript-eslint/no-explicit-any */

type Code = "VND" | "KRW" | "USD" | "EUR";
type RateMap = Record<Code, number>; // units per EUR (예: KRW/EUR)

const cache: Partial<RateMap> = {};
const SDMX_URL = (code: Code) =>
  `https://data-api.ecb.europa.eu/service/data/EXR/D.${code}.EUR.SP00.A?lastNObservations=1&format=jsondata`;
const XML_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

/** 1 base → quote 로 환산 비율 */
export async function getCrossRate(base: Code, quote: Code): Promise<number> {
  if (base === quote) return 1;
  // EUR이 섞이면 단순화
  if (base === "EUR") return await getUnitsPerEUR(quote);
  if (quote === "EUR") return 1 / (await getUnitsPerEUR(base));
  const [q, b] = await Promise.all([getUnitsPerEUR(quote), getUnitsPerEUR(base)]);
  return q / b;
}

/** 금액 환산 */
export async function convert(amount: number, base: Code, quote: Code): Promise<number> {
  const r = await getCrossRate(base, quote);
  return amount * r;
}

/** 코드별 units per EUR (예: 1 EUR = 1400 KRW → 1400) */
export async function getUnitsPerEUR(code: Code): Promise<number> {
  if (code === "EUR") return 1;
  if (cache[code]) return cache[code]!;
  // 1) SDMX JSON
  try {
    const j = await (await fetch(SDMX_URL(code))).json();
    const series = j?.dataSets?.[0]?.series;
    const key = series && Object.keys(series)[0];
    const obs = key && series[key]?.observations;
    const first = obs && Object.keys(obs)[0];
    const val = first ? obs[first][0] : undefined;
    if (typeof val === "number" && isFinite(val)) {
      cache[code] = val as number;
      return val as number;
    }
  } catch {}
  // 2) XML fallback
  const txt = await (await fetch(XML_URL)).text();
  const doc = new DOMParser().parseFromString(txt, "text/xml");
  const cubes = Array.from(doc.getElementsByTagName("Cube"));
  for (const n of cubes) {
    const c = n.getAttribute("currency");
    const r = n.getAttribute("rate");
    if (c === code && r) {
      const v = parseFloat(r);
      if (!Number.isNaN(v)) {
        cache[code] = v;
        return v;
      }
    }
  }
  throw new Error(`ECB rate missing for ${code}`);
}

/** 통화 포맷 유틸 */
export function formatMoney(v: number, code: Code) {
  const locale = code === "KRW" ? "ko-KR" : code === "VND" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 0 }).format(v);
}
