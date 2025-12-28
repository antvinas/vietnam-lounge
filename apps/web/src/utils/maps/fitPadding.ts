/**
 * 요약바/툴바 높이를 반영해 Google Maps fitBounds 패딩을 계산.
 * - sticky 상단바가 중심/마커를 가리는 문제를 방지합니다.
 * - topElement가 없으면 extraTop만 적용합니다.
 */
export function getFitPadding(opts: {
  topElement?: HTMLElement | null; // 상단 고정 바 요소(#plan-summary 등)
  extraTop?: number;               // 상단 여유 여백(px)
  right?: number;
  bottom?: number;
  left?: number;
} = {}): google.maps.Padding {
  const {
    topElement,
    extraTop = 16,
    right = 16,
    bottom = 16,
    left = 16,
  } = opts;

  let top = extraTop;

  if (topElement) {
    try {
      // 실제 렌더 기준의 높이(px). fractional 값은 올림해 가려짐을 예방.
      const rect = topElement.getBoundingClientRect();
      if (Number.isFinite(rect?.height)) {
        top += Math.max(0, Math.ceil(rect.height));
      }
    } catch {
      // 안전 장치: 실패 시 extraTop만 사용
    }
  }

  return { top, right, bottom, left };
}

/**
 * 예시:
 * const summaryEl = document.getElementById('plan-summary');
 * const pad = getFitPadding({ topElement: summaryEl, extraTop: 16, right: 16, bottom: 16, left: 16 });
 * map.fitBounds(bounds, pad);
 */
