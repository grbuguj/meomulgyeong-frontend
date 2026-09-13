import { useMemo, useState } from "react";
import { addDays, diffDays, formatMonthLabel, today, toISODate } from "../lib/date";

interface Props {
  /** 체크인 날짜(ISO). 아직 안 골랐으면 null */
  startDate: string | null;
  /** 체크아웃 날짜(ISO). 아직 안 골랐으면 null */
  endDate: string | null;
  /** 최대 숙박 일수(박) */
  maxNights: number;
  /** 몇 개월 뒤까지 이동할 수 있는지 */
  horizonMonths?: number;
  onChange: (next: { startDate: string; endDate: string | null }) => void;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 달력 6주 그리드용 날짜 배열(이전/다음 달 채움 포함) */
function buildMonthGrid(monthAnchor: Date): Date[] {
  const firstOfMonth = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const startOffset = firstOfMonth.getDay(); // 0=일요일
  const gridStart = addDays(firstOfMonth, -startOffset);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export default function DateRangeCalendar({ startDate, endDate, maxNights, horizonMonths = 6, onChange }: Props) {
  const base = today();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date(base.getFullYear(), base.getMonth(), 1));

  const minMonth = new Date(base.getFullYear(), base.getMonth(), 1);
  const maxMonth = new Date(base.getFullYear(), base.getMonth() + horizonMonths, 1);

  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

  const canGoPrev = monthAnchor.getTime() > minMonth.getTime();
  const canGoNext = monthAnchor.getTime() < maxMonth.getTime();

  const handleDayClick = (date: Date) => {
    if (date < base) return;
    const iso = toISODate(date);

    if (!startDate || (startDate && endDate)) {
      // 새로 시작: 체크인만 정하고 체크아웃은 비운다.
      onChange({ startDate: iso, endDate: null });
      return;
    }

    // 체크인은 있고 체크아웃은 아직 없는 상태
    const start = new Date(startDate + "T00:00:00");
    if (date.getTime() === start.getTime()) return; // 같은 날 재탭은 무시
    if (date < start) {
      // 체크인보다 이전 날짜를 탭하면 그 날짜를 새 체크인으로 삼는다.
      onChange({ startDate: iso, endDate: null });
      return;
    }
    const nights = diffDays(start, date);
    if (nights > maxNights) {
      // 최대 박수를 넘기면 그만큼만 잘라서 체크아웃으로 잡는다.
      onChange({ startDate, endDate: toISODate(addDays(start, maxNights)) });
      return;
    }
    onChange({ startDate, endDate: iso });
  };

  const start = startDate ? new Date(startDate + "T00:00:00") : null;
  const end = endDate ? new Date(endDate + "T00:00:00") : null;

  const cellState = (date: Date): "disabled" | "start" | "end" | "in-range" | "default" => {
    if (date < base) return "disabled";
    if (start && date.getTime() === start.getTime()) return "start";
    if (end && date.getTime() === end.getTime()) return "end";
    if (start && end && date > start && date < end) return "in-range";
    return "default";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => canGoPrev && setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}
          disabled={!canGoPrev}
          className="w-8 h-8 rounded-full flex items-center justify-center tap disabled:opacity-30"
          style={{ background: "white", boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 4px 10px -4px rgba(28,26,22,0.1)" }}
          aria-label="이전 달"
        >
          ‹
        </button>
        <p className="text-[14px] font-bold" style={{ color: "var(--color-ink)" }}>
          {formatMonthLabel(monthAnchor)}
        </p>
        <button
          type="button"
          onClick={() => canGoNext && setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-full flex items-center justify-center tap disabled:opacity-30"
          style={{ background: "white", boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 4px 10px -4px rgba(28,26,22,0.1)" }}
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className="text-center text-[11px] font-bold py-1"
            style={{ color: i === 0 ? "#c0392b" : i === 6 ? "var(--color-accent)" : "var(--color-ink-faint)" }}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((date) => {
          const inMonth = date.getMonth() === monthAnchor.getMonth();
          const state = cellState(date);
          const isEdge = state === "start" || state === "end";
          return (
            <button
              type="button"
              key={date.toISOString()}
              onClick={() => handleDayClick(date)}
              disabled={state === "disabled" || !inMonth}
              className="aspect-square flex items-center justify-center text-[12.5px] font-semibold tap disabled:cursor-not-allowed"
              style={{
                color: !inMonth
                  ? "transparent"
                  : state === "disabled"
                  ? "var(--color-ink-faint)"
                  : isEdge
                  ? "white"
                  : state === "in-range"
                  ? "var(--color-accent-dark)"
                  : "var(--color-ink)",
                background: isEdge
                  ? "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))"
                  : state === "in-range"
                  ? "var(--color-accent-soft)"
                  : "transparent",
                borderRadius:
                  state === "start" && end ? "50% 0 0 50%" : state === "end" ? "0 50% 50% 0" : "9999px",
                opacity: state === "disabled" ? 0.4 : 1,
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
