import { useEffect } from "react";
import useUiStore from "@/store/ui.store";

/**
 * 전역 DOM 클래스만 적용하는 경량 컴포넌트.
 * 실제 라우팅/페이지 렌더링은 RouterProvider(router)에서 처리한다.
 */
export default function App() {
  const { contentMode, themeMode } = useUiStore();

  // 다크·콘텐츠 모드 DOM 적용은 루트 한 곳에서만 수행
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", themeMode === "dark");
    root.setAttribute("data-content-mode", contentMode);
  }, [themeMode, contentMode]);

  // 라우팅 출력은 RouterProvider가 담당 -> 여기서는 반환할 UI 없음
  return null;
}
