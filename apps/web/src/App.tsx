// 📂 vietnam-lounge/apps/web/src/App.tsx
import { useEffect } from "react";
import useUiStore from "@/store/ui.store";
import { Routes } from "./routes";

function App() {
  const { contentMode, themeMode } = useUiStore();

  // 다크/라이트 + Explorer/Nightlife 모드 클래스 적용
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", themeMode === "dark");
    root.setAttribute("data-content-mode", contentMode);
  }, [themeMode, contentMode]);

  // 레이아웃은 routes.tsx에서 MainLayout/AdultLayout으로 처리
  return <Routes />;
}

export default App;
