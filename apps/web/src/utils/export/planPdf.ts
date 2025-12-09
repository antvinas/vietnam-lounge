// apps/web/src/utils/export/planPdf.ts

type Trip = {
  id: string;
  title?: string;
  startDateISO?: string;
  nights?: number;
  travelerCount?: number;
  budgetTotal?: number;
  currency?: string;
};

type Day = {
  id: string;
  tripId: string;
  order: number;
  dateISO: string;
};

type Item = {
  id: string;
  tripId: string;
  dayId: string;
  title: string;
  note?: string;
  cost?: number;
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
};

type Link = {
  id: string;
  tripId: string;
  fromItemId: string;
  toItemId: string;
  durationSec?: number;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateRange(trip: Trip): string {
  const nights = trip.nights ?? 2;
  const days = nights + 1;

  if (!trip.startDateISO) {
    return `${nights}박 ${days}일`;
  }
  const start = new Date(trip.startDateISO);
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + nights);

  const s = trip.startDateISO;
  const y = end.getFullYear();
  const m = `${end.getMonth() + 1}`.padStart(2, "0");
  const d = `${end.getDate()}`.padStart(2, "0");
  return `${nights}박 ${days}일 · ${s} ~ ${y}-${m}-${d}`;
}

function formatCurrency(v: number, currency: string | undefined): string {
  const c = currency || "VND";
  try {
    return new Intl.NumberFormat(
      c === "KRW" ? "ko-KR" : c === "USD" ? "en-US" : "vi-VN",
      {
        style: "currency",
        currency: c as any,
        maximumFractionDigits: 0,
      }
    ).format(v);
  } catch {
    return `${v.toLocaleString()} ${c}`;
  }
}

export function openPlanPrintFromNormalized(
  trip: Trip,
  days: Day[],
  items: Item[],
  links: Link[]
) {
  if (!trip) {
    window.alert("먼저 일정을 선택해 주세요.");
    return;
  }

  const win = window.open("", "_blank");
  if (!win) {
    window.alert("팝업이 차단되었습니다. 브라우저 설정을 확인해 주세요.");
    return;
  }

  // Day 정렬
  const sortedDays = [...days].sort((a, b) => a.order - b.order);

  // Day별 아이템 묶기
  const itemsByDay = new Map<string, Item[]>();
  for (const it of items) {
    if (!itemsByDay.has(it.dayId)) {
      itemsByDay.set(it.dayId, []);
    }
    itemsByDay.get(it.dayId)!.push(it);
  }
  for (const [dayId, list] of itemsByDay) {
    list.sort((a, b) => {
      const aTime = a.startTime || "";
      const bTime = b.startTime || "";
      return aTime.localeCompare(bTime);
    });
  }

  const totalBudget = trip.budgetTotal ?? 0;
  const plannedCost = items.reduce((sum, it) => sum + (it.cost ?? 0), 0);
  const budgetLeft = Math.max(0, totalBudget - plannedCost);
  const travelerCount = trip.travelerCount && trip.travelerCount > 0
    ? trip.travelerCount
    : 1;

  const title = trip.title || "제목 없는 여행";
  const rangeLabel = formatDateRange(trip);
  const currency = trip.currency || "VND";

  const doc = win.document;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} - 여행 일정 PDF</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
      background-color: #f9fafb;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 16mm 18mm;
      margin: 0 auto;
      background: white;
    }
    h1, h2, h3 {
      margin: 0;
      font-weight: 600;
      color: #111827;
    }
    .trip-header {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .trip-title {
      font-size: 20px;
      margin-bottom: 4px;
    }
    .trip-meta {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .trip-budget {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 11px;
    }
    .chip {
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    .chip-emerald {
      border-color: #a7f3d0;
      background: #ecfdf5;
      color: #047857;
    }
    .section {
      margin-top: 18px;
    }
    .section-title {
      font-size: 14px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    .day-block {
      margin-bottom: 12px;
    }
    .day-heading {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .day-date {
      font-size: 11px;
      color: #6b7280;
      margin-left: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      padding: 4px 6px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    th {
      text-align: left;
      background: #f9fafb;
      font-weight: 600;
    }
    .time-col {
      width: 70px;
      white-space: nowrap;
      font-feature-settings: "tnum";
    }
    .cost-col {
      width: 90px;
      text-align: right;
      font-feature-settings: "tnum";
    }
    .note {
      color: #6b7280;
      margin-top: 2px;
    }
    @media print {
      body {
        background: white;
      }
      .page {
        box-shadow: none;
        margin: 0;
        width: auto;
        min-height: auto;
        padding: 12mm 14mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="trip-header">
      <div class="trip-title">${escapeHtml(title)}</div>
      <div class="trip-meta">
        ${escapeHtml(rangeLabel)} · ${travelerCount}명 · 통화: ${escapeHtml(currency)}
      </div>
      <div class="trip-budget">
        <span class="chip">
          총 예산: <strong>${escapeHtml(formatCurrency(totalBudget, currency))}</strong>
        </span>
        <span class="chip">
          예상 지출: <strong>${escapeHtml(formatCurrency(plannedCost, currency))}</strong>
        </span>
        <span class="chip chip-emerald">
          남은 예산: <strong>${escapeHtml(formatCurrency(budgetLeft, currency))}</strong>
        </span>
      </div>
    </header>

    <section class="section">
      <h2 class="section-title">일정 상세</h2>
`);

  for (const d of sortedDays) {
    const list = itemsByDay.get(d.id) ?? [];
    const dateLabel = d.dateISO;
    let dayCost = 0;
    for (const it of list) {
      dayCost += it.cost ?? 0;
    }

    doc.write(`
      <div class="day-block">
        <div class="day-heading">
          Day ${d.order}
          <span class="day-date">${escapeHtml(dateLabel)}</span>
          <span style="margin-left:8px; font-size:11px; color:#047857;">
            이 날 예상 비용: ${escapeHtml(formatCurrency(dayCost, currency))}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="time-col">시간</th>
              <th>일정</th>
              <th class="cost-col">예상 비용</th>
            </tr>
          </thead>
          <tbody>
    `);

    for (const it of list) {
      const timeLabel = (it.startTime && it.endTime)
        ? `${it.startTime} ~ ${it.endTime}`
        : it.startTime || it.endTime || "시간 미정";
      const costLabel =
        it.cost != null
          ? formatCurrency(it.cost, currency)
          : "";

      doc.write(`
        <tr>
          <td class="time-col">${escapeHtml(timeLabel)}</td>
          <td>
            <div>${escapeHtml(it.title)}</div>
            ${
              it.note
                ? `<div class="note">${escapeHtml(it.note)}</div>`
                : ""
            }
          </td>
          <td class="cost-col">
            ${costLabel ? escapeHtml(costLabel) : ""}
          </td>
        </tr>
      `);
    }

    if (list.length === 0) {
      doc.write(`
        <tr>
          <td class="time-col">-</td>
          <td colspan="2">등록된 일정이 없습니다.</td>
        </tr>
      `);
    }

    doc.write(`
          </tbody>
        </table>
      </div>
    `);
  }

  doc.write(`
    </section>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`);
  doc.close();
}
