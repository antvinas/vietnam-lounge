import { useEffect } from "react";

/**
 * 모달/시트가 열릴 때 문서 스크롤을 잠급니다.
 * body 패딩을 보정해 레이아웃 점프를 방지합니다.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;

    if (locked) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      body.style.overflow = originalOverflow || "";
      body.style.paddingRight = originalPaddingRight || "";
    }

    return () => {
      body.style.overflow = originalOverflow || "";
      body.style.paddingRight = originalPaddingRight || "";
    };
  }, [locked]);
}
