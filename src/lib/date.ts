/**
 * 로컬(브라우저) 기준 날짜 유틸.
 * `Date.toISOString()`은 UTC로 변환하기 때문에 한국시간 밤~새벽 사이(UTC보다 9시간 빠름)에는
 * 하루 어긋난 날짜가 나올 수 있다. 여기서는 항상 로컬 연/월/일로만 계산한다.
 */

/** Date → "YYYY-MM-DD" (로컬 기준) */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → Date (로컬 자정) */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** 자정 기준 오늘 날짜 */
export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** a와 b 사이의 일수 차이 (b - a) */
export function diffDays(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKoreanDate(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${WEEKDAY_LABELS[date.getDay()]})`;
}

export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
