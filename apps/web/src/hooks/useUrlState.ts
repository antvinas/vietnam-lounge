import { useSearchParams } from "react-router-dom";

type UrlState = {
  region?: string;
  category?: string;
  sort?: string;
};

export default function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setUrlState = (state: UrlState) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(state).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "default") {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    // replace: true → 브라우저 기록에 불필요한 push 쌓이지 않음
    setSearchParams(newParams, { replace: true });
  };

  const getUrlState = (): UrlState => {
    return {
      region: searchParams.get("region") || "all",
      category: searchParams.get("category") || "all",
      sort: searchParams.get("sort") || "latest", // 기본값을 실제 정렬키에 맞춤
    };
  };

  return { setUrlState, getUrlState };
}
