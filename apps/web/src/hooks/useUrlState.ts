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
      if (value && value !== "all") {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const getUrlState = (): UrlState => {
    return {
      region: searchParams.get("region") || "all",
      category: searchParams.get("category") || "all",
      sort: searchParams.get("sort") || "default",
    };
  };

  return { setUrlState, getUrlState };
}
