// components/plan/strings.ts

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
      title: "여행 계획, 지금부터 가볍게 시작해요",
      subtitle:
        "도시와 날짜만 정하면 3분 안에 초안을 만들 수 있어요. 언제든 편하게 고치고 덧붙이세요.",
      ctaNew: "지금 만들기",
      ctaSample: "예시 먼저 구경",
      ctaOpenExisting: "지난 계획 열기",
      hint: "초안은 저장이 부담되면 건너뛰어도 괜찮아요. 원하는 순간에 저장할 수 있어요.",
    },
    sample: {
      title: "어떤 도시부터 가볼까요?",
      desc:
        "도시를 고르면 1–2일짜리 샘플 일정이 바로 펼쳐져요. 마음에 들면 그대로 시작하고, 싫으면 가볍게 닫으세요.",
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
      title: "Start your trip plan, the easy way",
      subtitle:
        "Pick a city and dates—get a draft in under 3 minutes. Edit anything, anytime.",
      ctaNew: "Create now",
      ctaSample: "Preview sample",
      ctaOpenExisting: "Open previous plan",
      hint: "No pressure to save. Keep planning and save when you’re ready.",
    },
    sample: {
      title: "Which city shall we start with?",
      desc:
        "Pick a city to open a 1–2 day sample plan. Keep it if you like—close it if you don’t.",
      tip: "Tip: ESC to close, Enter to select.",
      previewNote:
        "Samples open temporarily. Leaving the page cleans them up.",
      openNow: "Open now",
      openNowAria: "Open sample plan",
      close: "Close",
      toastOpened: "Sample plan opened",
      toastFailed: "Couldn’t open the sample plan",
      opening: "Opening…",
    },
    toolbar: {
      addPlace: "Add place",
      nearby: "Explore nearby",
      optimize: "Tidy route",
      fullscreen: "Fullscreen",
      filterLabel: "Show",
      savedTimeChip: (m) => `-${m} min`,
    },
    summary: {
      budgetLeft: "Budget left",
      travelTime: "Travel time",
      overlaps: "Overlap",
      openingHours: "Opening hours",
      calculating: "Calculating…",
    },
    optimize: {
      run: "Optimize route",
      running: "Optimizing…",
      done: "Done",
      apply: "Apply",
      cancel: "Cancel",
      previewBefore: "Before",
      previewAfter: "Preview",
      needThree: "At least 3 points are required.",
      savedTime: (m) => `Saves ~${m} min`,
    },
    a11y: {
      resizeLabel: "Resize sidebar",
      toolbarLabel: "Map toolbar",
      toolbarFilters: "Filter toggles",
      contextMenuLabel: "Context menu",
    },
    search: {
      placeholder: "e.g. bun cha, rooftop cafe",
      searchButton: "Search",
      closeButton: "Close",
      loading: "Searching…",
      empty: "No results",
      addButton: "Add",
      tip: "Tip: Press Enter to search, ESC to close",
      selectDayWarning: "Please choose a day first.",
    },
    planPage: {
      leaveSampleConfirm:
        "Sample plans are temporary. Leaving this page will discard them. Continue?",
      noSavedTrip: "You don’t have any saved plans yet.",
      selectTripFirst: "Please select a plan first.",
      pdfError: "Something went wrong while generating the PDF.",
      pdfButton: "Export as PDF",
      mobileTodayTitle: "Today’s plan",
      mobileSampleButton: "Open sample",
      mobileAddPlaceButton: "Add place",
    },
  },
  vi: {
    empty: {
      title: "Bắt đầu kế hoạch du lịch thật nhẹ nhàng",
      subtitle:
        "Chọn thành phố và ngày — có bản nháp trong 3 phút. Sửa bất cứ lúc nào.",
      ctaNew: "Tạo ngay",
      ctaSample: "Xem trước mẫu",
      ctaOpenExisting: "Mở kế hoạch cũ",
      hint: "Không cần lưu vội. Lưu khi bạn sẵn sàng.",
    },
    sample: {
      title: "Bắt đầu ở thành phố nào?",
      desc:
        "Chọn thành phố để mở kế hoạch mẫu 1–2 ngày. Hợp thì dùng luôn, chưa hợp thì đóng lại.",
      tip: "Mẹo: ESC để đóng, Enter để chọn.",
      previewNote:
        "Mẫu chỉ mở tạm thời. Rời trang là dọn gọn ngay.",
      openNow: "Mở ngay",
      openNowAria: "Mở kế hoạch mẫu",
      close: "Đóng",
      toastOpened: "Đã mở kế hoạch mẫu",
      toastFailed: "Không mở được kế hoạch mẫu",
      opening: "Đang mở…",
    },
    toolbar: {
      addPlace: "Thêm địa điểm",
      nearby: "Khám phá gần đây",
      optimize: "Sắp xếp lộ trình",
      fullscreen: "Toàn màn hình",
      filterLabel: "Hiển thị",
      savedTimeChip: (m) => `-${m} phút`,
    },
    summary: {
      budgetLeft: "Ngân sách còn lại",
      travelTime: "Thời gian di chuyển",
      overlaps: "Lịch trùng",
      openingHours: "Ngoài giờ mở cửa",
      calculating: "Đang tính…",
    },
    optimize: {
      run: "Tối ưu lộ trình",
      running: "Đang tối ưu…",
      done: "Hoàn tất",
      apply: "Áp dụng",
      cancel: "Hủy",
      previewBefore: "Trước",
      previewAfter: "Xem trước",
      needThree: "Cần ít nhất 3 điểm.",
      savedTime: (m) => `Tiết kiệm ~${m} phút`,
    },
    a11y: {
      resizeLabel: "Điều chỉnh chiều rộng thanh bên",
      toolbarLabel: "Thanh công cụ bản đồ",
      toolbarFilters: "Nhóm bật/tắt hiển thị",
      contextMenuLabel: "Menu ngữ cảnh",
    },
    search: {
      placeholder: "VD: bún chả ngon, quán cà phê view đẹp",
      searchButton: "Tìm kiếm",
      closeButton: "Đóng",
      loading: "Đang tìm…",
      empty: "Không có kết quả",
      addButton: "Thêm",
      tip: "Mẹo: Enter để tìm, ESC để đóng",
      selectDayWarning: "Hãy chọn ngày muốn thêm trước.",
    },
    planPage: {
      leaveSampleConfirm:
        "Lịch mẫu chỉ mở tạm thời. Rời trang này sẽ xóa chúng. Tiếp tục chứ?",
      noSavedTrip: "Bạn chưa có kế hoạch nào được lưu.",
      selectTripFirst: "Hãy chọn một kế hoạch trước.",
      pdfError: "Có lỗi xảy ra khi xuất PDF.",
      pdfButton: "Xuất PDF",
      mobileTodayTitle: "Lịch hôm nay",
      mobileSampleButton: "Mở lịch mẫu",
      mobileAddPlaceButton: "Thêm địa điểm",
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
