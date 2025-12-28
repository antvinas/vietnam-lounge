// apps/web/src/features/plan/locales/strings.ts

export type Locale = "ko" | "en" | "vi";

type Strings = {
  empty: {
    title: string;
    subtitle: string;
    ctaNew: string;
    ctaSample: string;
    ctaOpenExisting: string;
    hint: string;
  };
  /** 샘플(예시 일정) 선택 모달 */
  sample: {
    title: string;
    desc: string;
    tip: string;
    previewNote: string;
    openNow: string;
    openNowAria: string;
    close: string;
    toastOpened: string;
    toastFailed: string;
    opening: string;
  };
  toolbar: {
    addPlace: string;
    nearby: string;
    optimize: string;
    fullscreen: string;
    filterLabel: string;
    savedTimeChip: (min: number) => string;
  };
  summary: {
    budgetLeft: string;
    travelTime: string;
    overlaps: string;
    openingHours: string;
    calculating: string;
  };
  optimize: {
    run: string;
    running: string;
    done: string;
    apply: string;
    cancel: string;
    previewBefore: string;
    previewAfter: string;
    needThree: string;
    savedTime: (min: number) => string;
  };
  a11y: {
    resizeLabel: string;
    toolbarLabel: string;
    toolbarFilters: string;
    contextMenuLabel: string;
  };
  /** 검색 오버레이 */
  search: {
    title: string; // ✅ 추가 (PlanSearchOverlay에서 사용)
    placeholder: string;
    searchButton: string;
    closeButton: string;
    loading: string;
    empty: string;
    addButton: string;
    tip: string;
    selectDayWarning: string;
  };
  /** 플랜 메인 페이지 */
  planPage: {
    quickTripTitle: string; // ✅ 추가 (PlanOrchestrator에서 사용)
    noTripToExport: string; // ✅ 추가 (PlanOrchestrator에서 사용)
    leaveSampleConfirm: string;
    noSavedTrip: string;
    selectTripFirst: string;
    pdfError: string;
    pdfButton: string;
    mobileTodayTitle: string;
    mobileSampleButton: string;
    mobileAddPlaceButton: string;
  };
};

export const STRINGS: Record<Locale, Strings> = {
  ko: {
    empty: {
      // [카피라이팅 수정] 히어로 섹션용 감성 문구
      title: "당신의 완벽한 베트남 여행,\n지금 시작해볼까요?",
      subtitle:
        "낮에는 힐링, 밤에는 킬링. 베트남 라운지가 제안하는 최고의 코스를 만나보세요.",
      ctaNew: "빈 화면에서 직접 만들래요",
      ctaSample: "추천 코스로 시작하기",
      ctaOpenExisting: "이전 일정 열기",
      hint: "마음에 드는 코스를 골라 내 일정으로 복사해보세요.",
    },
    sample: {
      title: "어떤 도시부터 가볼까요?",
      desc:
        "도시를 고르면 3박 4일 알짜배기 추천 코스가 바로 펼쳐져요. 마음에 들면 그대로 시작하고, 싫으면 가볍게 닫으세요.",
      tip: "Tip: ESC로 닫기, Enter로 선택.",
      previewNote:
        "샘플은 임시로만 열려요. 페이지를 벗어나면 깔끔히 정리됩니다.",
      openNow: "지금 열기",
      openNowAria: "예시 일정 열기",
      close: "닫기",
      toastOpened: "예시 일정이 열렸어요",
      toastFailed: "예시 일정을 불러오지 못했어요",
      opening: "열리는 중…",
    },
    toolbar: {
      addPlace: "장소 추가",
      nearby: "주변 탐색",
      optimize: "동선 정리",
      fullscreen: "전체 화면",
      filterLabel: "표시",
      savedTimeChip: (m) => `-${m}분`,
    },
    summary: {
      budgetLeft: "남은 예산",
      travelTime: "이동시간",
      overlaps: "겹침",
      openingHours: "영업시간",
      calculating: "계산 중…",
    },
    optimize: {
      run: "경로 최적화",
      running: "최적화 중…",
      done: "완료",
      apply: "적용",
      cancel: "취소",
      previewBefore: "이전",
      previewAfter: "미리보기",
      needThree: "최소 3개 지점이 필요합니다.",
      savedTime: (m) => `예상 절감 ${m}분`,
    },
    a11y: {
      resizeLabel: "사이드바 크기 조절",
      toolbarLabel: "지도 도구막대",
      toolbarFilters: "표시 토글 그룹",
      contextMenuLabel: "컨텍스트 메뉴",
    },
    search: {
      title: "장소 검색", // ✅ 추가
      placeholder: "예: 분짜 맛집, 전망 좋은 카페",
      searchButton: "검색",
      closeButton: "닫기",
      loading: "검색 중…",
      empty: "결과 없음",
      addButton: "추가",
      tip: "Tip: Enter로 검색, ESC로 닫기",
      selectDayWarning: "먼저 추가할 날짜(일정)를 선택해 주세요.",
    },
    planPage: {
      quickTripTitle: "빠른 일정", // ✅ 추가
      noTripToExport: "내보낼 일정이 없어요.", // ✅ 추가
      leaveSampleConfirm:
        "예시 일정은 임시로 열려 있어요. 이 페이지를 떠나면 정리됩니다. 계속할까요?",
      noSavedTrip: "저장된 일정이 아직 없어요.",
      selectTripFirst: "먼저 플랜을 선택해 주세요.",
      pdfError: "PDF 내보내기 중 오류가 발생했어요.",
      pdfButton: "PDF로 내보내기",
      mobileTodayTitle: "오늘 일정",
      mobileSampleButton: "예시 불러오기",
      mobileAddPlaceButton: "장소 추가",
    },
  },
  en: {
    empty: {
      title: "Your Perfect Vietnam Trip,\nStarts Here.",
      subtitle:
        "Healing by day, Killing by night. Discover the best courses curated by Vietnam Lounge.",
      ctaNew: "Create from scratch",
      ctaSample: "Start with Featured Plans",
      ctaOpenExisting: "Open saved plan",
      hint: "Pick a course and copy it to your plan.",
    },
    sample: {
      title: "Which city shall we start with?",
      desc: "Pick a city to open a 3-night 4-day sample plan.",
      tip: "Tip: ESC to close, Enter to select.",
      previewNote: "Samples open temporarily.",
      openNow: "Open now",
      openNowAria: "Open sample plan",
      close: "Close",
      toastOpened: "Sample plan opened",
      toastFailed: "Error opening sample",
      opening: "Opening…",
    },
    toolbar: {
      addPlace: "Add place",
      nearby: "Nearby",
      optimize: "Tidy route",
      fullscreen: "Fullscreen",
      filterLabel: "Show",
      savedTimeChip: (m) => `-${m} min`,
    },
    summary: {
      budgetLeft: "Budget left",
      travelTime: "Travel time",
      overlaps: "Overlap",
      openingHours: "Hours",
      calculating: "Calculating…",
    },
    optimize: {
      run: "Optimize",
      running: "Optimizing…",
      done: "Done",
      apply: "Apply",
      cancel: "Cancel",
      previewBefore: "Before",
      previewAfter: "Preview",
      needThree: "At least 3 points.",
      savedTime: (m) => `Saves ~${m} min`,
    },
    a11y: {
      resizeLabel: "Resize sidebar",
      toolbarLabel: "Map toolbar",
      toolbarFilters: "Filter toggles",
      contextMenuLabel: "Context menu",
    },
    search: {
      title: "Search places", // ✅ 추가
      placeholder: "e.g. bun cha, rooftop cafe",
      searchButton: "Search",
      closeButton: "Close",
      loading: "Searching…",
      empty: "No results",
      addButton: "Add",
      tip: "Tip: Enter to search",
      selectDayWarning: "Choose a day first.",
    },
    planPage: {
      quickTripTitle: "Quick trip", // ✅ 추가
      noTripToExport: "No trip to export.", // ✅ 추가
      leaveSampleConfirm: "Leaving will discard sample plan. Continue?",
      noSavedTrip: "No saved plans.",
      selectTripFirst: "Select a plan first.",
      pdfError: "PDF export failed.",
      pdfButton: "Export PDF",
      mobileTodayTitle: "Today",
      mobileSampleButton: "Samples",
      mobileAddPlaceButton: "Add",
    },
  },
  vi: {
    empty: {
      title: "Chuyến đi Việt Nam hoàn hảo,\nBắt đầu từ đây.",
      subtitle:
        "Ngày thư giãn, Đêm sôi động. Khám phá các lộ trình tốt nhất từ Vietnam Lounge.",
      ctaNew: "Tạo mới",
      ctaSample: "Bắt đầu với Mẫu",
      ctaOpenExisting: "Mở lại",
      hint: "Chọn một lộ trình và sao chép vào kế hoạch của bạn.",
    },
    sample: {
      title: "Bắt đầu ở đâu?",
      desc: "Chọn thành phố để xem mẫu 3 ngày 4 đêm.",
      tip: "Mẹo: ESC để đóng.",
      previewNote: "Mẫu chỉ mở tạm thời.",
      openNow: "Mở ngay",
      openNowAria: "Mở mẫu",
      close: "Đóng",
      toastOpened: "Đã mở mẫu",
      toastFailed: "Lỗi mở mẫu",
      opening: "Đang mở…",
    },
    toolbar: {
      addPlace: "Thêm",
      nearby: "Gần đây",
      optimize: "Tối ưu",
      fullscreen: "Toàn màn hình",
      filterLabel: "Hiển thị",
      savedTimeChip: (m) => `-${m} phút`,
    },
    summary: {
      budgetLeft: "Ngân sách",
      travelTime: "Di chuyển",
      overlaps: "Trùng",
      openingHours: "Giờ mở",
      calculating: "Tính…",
    },
    optimize: {
      run: "Tối ưu",
      running: "Đang chạy…",
      done: "Xong",
      apply: "Áp dụng",
      cancel: "Hủy",
      previewBefore: "Trước",
      previewAfter: "Sau",
      needThree: "Cần 3 điểm.",
      savedTime: (m) => `Tiết kiệm ${m}p`,
    },
    a11y: {
      resizeLabel: "Chỉnh kích thước",
      toolbarLabel: "Công cụ bản đồ",
      toolbarFilters: "Bộ lọc",
      contextMenuLabel: "Menu",
    },
    search: {
      title: "Tìm địa điểm", // ✅ 추가
      placeholder: "VD: bún chả, cà phê",
      searchButton: "Tìm",
      closeButton: "Đóng",
      loading: "Đang tìm…",
      empty: "Không có",
      addButton: "Thêm",
      tip: "Enter để tìm",
      selectDayWarning: "Chọn ngày trước.",
    },
    planPage: {
      quickTripTitle: "Lịch trình nhanh", // ✅ 추가
      noTripToExport: "Không có lịch trình để xuất.", // ✅ 추가
      leaveSampleConfirm: "Rời trang sẽ xóa mẫu. Tiếp tục?",
      noSavedTrip: "Chưa có kế hoạch.",
      selectTripFirst: "Chọn kế hoạch trước.",
      pdfError: "Lỗi xuất PDF.",
      pdfButton: "Xuất PDF",
      mobileTodayTitle: "Hôm nay",
      mobileSampleButton: "Mẫu",
      mobileAddPlaceButton: "Thêm",
    },
  },
};

/** 다국어 헬퍼 */
export function t<K1 extends keyof Strings, K2 extends keyof Strings[K1]>(
  locale: Locale,
  ns: K1,
  key: K2
): Strings[K1][K2] {
  return STRINGS[locale][ns][key];
}

/** navigator.language 기반 기본 Locale 감지 */
export function getDefaultLocale(): Locale {
  if (typeof navigator !== "undefined") {
    const lang =
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      "en";
    const lower = lang.toLowerCase();
    if (lower.startsWith("ko")) return "ko";
    if (lower.startsWith("vi")) return "vi";
  }
  return "en";
}
