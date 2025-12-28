// apps/web/src/App.tsx
import { useEffect } from "react";
import useUiStore from "./store/ui.store";

export default function App() {
  const themeMode = useUiStore((s) => s.themeMode);
  const contentMode = useUiStore((s) => s.contentMode);

  // ✅ themeMode/contentMode를 실제 DOM(html.dark)에 반영
  // - Nightlife는 항상 다크로 강제(UX 일관성)
  useEffect(() => {
    const root = document.documentElement;
    const shouldDark = contentMode === "nightlife" || themeMode === "dark";
    root.classList.toggle("dark", shouldDark);
  }, [contentMode, themeMode]);

  return null;
}
