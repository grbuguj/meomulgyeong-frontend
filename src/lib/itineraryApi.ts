import { apiFetch } from "./apiClient";
import type { CompanionType, DayPlan, Itinerary, PlaceItem, TripCompletion } from "../types";
import { REGIONS } from "../data/regions";

// ────────────────────────────────────────────────────────────
// 백엔드 ERD 기반 타입 — 실제 스펙이 나오면 TODO 부분을 수정한다.
// ────────────────────────────────────────────────────────────

/** ERD itinerary_item.item_type 열거값 */
export type BackendItemType =
  | "ARRIVAL"
  | "TOURIST_SPOT"
  | "RESTAURANT"
  | "EXPERIENCE"
  | "FESTIVAL"
  | "REST"
  | "DEPARTURE";

// TODO: 백엔드 실제 스펙 확인 필요 — companion_type 열거값 (FRIENDS vs FRIEND 등)
export type BackendCompanionType = "SOLO" | "COUPLE" | "FRIENDS" | "FAMILY";

export interface CreateItineraryRequest {
  regionId: number;
  companionType: BackendCompanionType;
  nights: number;
  startDate: string; // "YYYY-MM-DD"
  preferenceTags: string[];
}

export interface ItineraryItemResponse {
  itemId: number;
  sequence: number;
  type: BackendItemType;
  title: string;
  reason: string | null;
  placeId: number | null;
  festivalId: number | null;
  imageUrl: string | null;
  address: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  replaceable: boolean;
}

export interface ItineraryDayResponse {
  dayNumber: number;
  date: string; // "YYYY-MM-DD"
  weather: {
    available: boolean;
    condition: string | null;
    minimumTemperature: number | null;
    maximumTemperature: number | null;
  };
  items: ItineraryItemResponse[];
}

export interface ItineraryResponse {
  itineraryId: number;
  region: { regionId: number; regionName: string };
  companionType: BackendCompanionType;
  nights: number;
  startDate: string;
  endDate: string;
  title: string;
  status: string;
  bookmarked: boolean;
  generationVersion: number;
  days: ItineraryDayResponse[];
  warnings?: { code: string; message: string }[];
}

/** 저장 일정 목록 응답 — 상세(days)를 포함하지 않는 요약본이다. */
export interface BookmarkedItinerarySummary {
  itineraryId: number;
  region: { regionId: number; regionName: string };
  title: string;
  startDate: string;
  endDate: string;
  nights: number;
  status: string;
  bookmarkedAt: string;
}

export interface ReplaceItemRequest {
  excludePreviouslyRecommended?: boolean;
}

export interface ReplaceItemResponse {
  itineraryId: number;
  replacedItemId: number;
  newItem: ItineraryItemResponse;
  generationVersion: number;
}

export interface CompleteItineraryRequest {
  stayHours: number;
  partySize: number;
  totalSpent: number;
}

export interface CompleteItineraryResponse {
  completedTripId: number;
  itineraryId: number;
  region: { regionId: number; regionName: string };
  stayHours: number;
  partySize: number;
  totalSpent: number;
  stamp: {
    awarded: boolean;
    newlyAwarded: boolean;
    regionId: number;
    regionName: string;
    visitCount: number;
  };
  contribution: {
    populationContributionDays: number | null;
    calculationStatus: string;
    calculationPolicyVersion: string;
  };
  completedAt: string;
}

// ────────────────────────────────────────────────────────────
// 프론트엔드 타입 → 백엔드 코드 매핑
// ────────────────────────────────────────────────────────────

/** 프론트엔드 CompanionType → 백엔드 companionType 변환
 *  저장된 일정(구 코드: alone/couple/friend/family)과
 *  신규 홈(백엔드 코드: SOLO/COUPLE/FRIENDS/FAMILY) 양쪽을 지원한다. */
export function toBackendCompanion(companion: string): BackendCompanionType {
  const MAP: Record<string, BackendCompanionType> = {
    alone: "SOLO",
    couple: "COUPLE",
    friend: "FRIENDS",
    family: "FAMILY",
    SOLO: "SOLO",
    COUPLE: "COUPLE",
    FRIENDS: "FRIENDS",
    FAMILY: "FAMILY",
  };
  return MAP[companion] ?? "SOLO";
}

const ITEM_CATEGORY_MAP: Record<BackendItemType, PlaceItem["category"]> = {
  TOURIST_SPOT: "attraction",
  FESTIVAL: "attraction",
  RESTAURANT: "food",
  EXPERIENCE: "experience",
  ARRIVAL: "transit",
  REST: "stay",
  DEPARTURE: "transit",
};

/** 백엔드는 시간 필드를 주지 않으므로 sequence로 09:00부터 2시간 간격을 추정한다. */
function sequenceToTime(sequence: number): string {
  const hour = Math.min(9 + (Math.max(sequence, 1) - 1) * 2, 23);
  return `${String(hour).padStart(2, "0")}:00`;
}

/** 백엔드 날씨 열거값 → 한국어 라벨 */
const WEATHER_CONDITION_LABELS: Record<string, string> = {
  SUNNY: "맑음",
  PARTLY_CLOUDY: "구름 조금",
  CLOUDY: "흐림",
  RAIN: "비",
  SHOWER: "소나기",
  SLEET: "진눈깨비",
  SNOW: "눈",
};

/**
 * 도착/휴식/출발은 실제 장소가 아니라 일정 구성용 자리채움 항목이라
 * 백엔드가 title에 "ARRIVAL"/"REST"/"DEPARTURE" 영문 상수를 그대로 내려준다.
 * 실제 장소(관광/식사/체험/축제)는 백엔드 title(장소명)을 그대로 쓴다.
 */
const PLACEHOLDER_ITEM_LABELS: Partial<Record<BackendItemType, string>> = {
  ARRIVAL: "지역 도착",
  REST: "자유 시간",
  DEPARTURE: "지역 출발",
};

function toFrontendItem(item: ItineraryItemResponse, regionId: string): PlaceItem {
  return {
    id: String(item.itemId),
    regionId,
    name: PLACEHOLDER_ITEM_LABELS[item.type] ?? item.title,
    category: ITEM_CATEGORY_MAP[item.type] ?? "stay",
    time: sequenceToTime(item.sequence),
    description: item.reason ?? "",
    imageUrl: item.imageUrl,
    address: item.address,
    replaceable: item.replaceable,
  };
}

function toFrontendDay(day: ItineraryDayResponse, regionId: string): DayPlan {
  const condition = day.weather.condition;
  return {
    day: day.dayNumber,
    date: day.date,
    weather: {
      temp: day.weather.maximumTemperature,
      condition: condition ? WEATHER_CONDITION_LABELS[condition] ?? condition : null,
    },
    items: day.items.map((it) => toFrontendItem(it, regionId)),
  };
}

/**
 * 백엔드 regionName → 프론트엔드 region id(예: "andong") 변환
 * REGIONS 배열과 name/shortName으로 매칭하고, 실패하면 regionId를 문자열로 폴백한다.
 */
export function resolveFrontendRegionId(regionName: string, backendRegionId?: number): string {
  const matched = REGIONS.find((r) => r.name === regionName || r.shortName === regionName);
  if (matched) return matched.id;
  return backendRegionId ? `api-${backendRegionId}` : `api-${regionName}`;
}

/** 백엔드 ItineraryResponse → 프론트엔드 Itinerary 변환 */
export function toFrontendItinerary(res: ItineraryResponse, frontendRegionId: string): Itinerary {
  const companionLegacyMap: Record<BackendCompanionType, CompanionType> = {
    SOLO: "alone",
    COUPLE: "couple",
    FRIENDS: "friend",
    FAMILY: "family",
  };
  return {
    id: String(res.itineraryId),
    regionId: frontendRegionId,
    backendItineraryId: res.itineraryId,
    nights: res.nights,
    companion: companionLegacyMap[res.companionType] ?? "alone",
    days: res.days.map((d) => toFrontendDay(d, frontendRegionId)),
    warnings: res.warnings,
  };
}

// ────────────────────────────────────────────────────────────
// API 함수 (8개)
// ────────────────────────────────────────────────────────────

/** 1. 일정 생성 */
export async function createItinerary(req: CreateItineraryRequest): Promise<ItineraryResponse> {
  return apiFetch<ItineraryResponse>("/api/itineraries", {
    method: "POST",
    body: req,
  });
}

/** 2. 일정 조회 */
export async function getItinerary(itineraryId: number): Promise<ItineraryResponse> {
  return apiFetch<ItineraryResponse>(`/api/itineraries/${itineraryId}`);
}

/** 3. 일정 아이템 교체 (교체 ↻ 버튼) */
// TODO: 백엔드 실제 스펙 확인 필요 — HTTP 메서드(PATCH/POST), 요청 바디 형식, 응답 형식 확인
export async function replaceItineraryItem(
  itineraryId: number,
  itemId: number,
  req: ReplaceItemRequest = {}
): Promise<ReplaceItemResponse> {
  return apiFetch<ReplaceItemResponse>(`/api/itineraries/${itineraryId}/items/${itemId}/replace`, {
    method: "POST",
    body: req,
  });
}

/** 4. 전체 일정 재생성 */
// TODO: 백엔드 실제 스펙 확인 필요 — 요청 바디 필요 여부, 응답 형식 확인
export async function regenerateFullItinerary(itineraryId: number): Promise<ItineraryResponse> {
  return apiFetch<ItineraryResponse>(`/api/itineraries/${itineraryId}/regenerate`, {
    method: "POST",
  });
}

/** 5. 일정 북마크 추가 */
// TODO: 백엔드 실제 스펙 확인 필요 — 엔드포인트(bookmark vs save), 응답 형식 확인
export async function bookmarkItinerary(itineraryId: number): Promise<void> {
  await apiFetch<null>(`/api/itineraries/${itineraryId}/bookmark`, {
    method: "PUT",
  });
}

/** 6. 일정 북마크 해제 */
export async function unbookmarkItinerary(itineraryId: number): Promise<void> {
  await apiFetch<null>(`/api/itineraries/${itineraryId}/bookmark`, {
    method: "DELETE",
  });
}

/** 7. 여행 완료 등록 */
export async function completeItinerary(
  itineraryId: number,
  req: CompleteItineraryRequest
): Promise<CompleteItineraryResponse> {
  return apiFetch<CompleteItineraryResponse>(`/api/itineraries/${itineraryId}/completion`, {
    method: "POST",
    body: req,
  });
}

/**
 * 8. 내 저장 일정 목록 조회.
 * 목록 응답에 지역·기간이 모두 들어있으므로 상세를 추가로 조회하지 않는다.
 * 일자별 상세는 목록에서 항목을 열 때 getItinerary로 가져온다.
 */
export async function listBookmarkedItineraries(): Promise<BookmarkedItinerarySummary[]> {
  const bookmarks = await apiFetch<{ itineraries: BookmarkedItinerarySummary[] }>(
    "/api/users/me/bookmarked-itineraries",
  );
  return bookmarks.itineraries;
}

/** 저장 일정 요약 → 프론트엔드 Itinerary (일자별 상세는 열람 시점에 조회한다) */
export function toFrontendItinerarySummary(
  summary: BookmarkedItinerarySummary,
  frontendRegionId: string
): Itinerary {
  return {
    id: String(summary.itineraryId),
    regionId: frontendRegionId,
    backendItineraryId: summary.itineraryId,
    nights: summary.nights,
    companion: "alone",
    days: [],
    savedAt: summary.bookmarkedAt,
  };
}

/** 완료 응답으로 TripCompletion 객체 생성 */
export function toTripCompletion(
  res: CompleteItineraryResponse,
  frontendRegionId: string,
  visitedDays: number,
  visitors: number
): TripCompletion {
  return {
    itineraryId: String(res.itineraryId),
    regionId: frontendRegionId,
    visitedDays,
    visitors,
    completedAt: res.completedAt,
    contribution: {
      stayHours: res.stayHours,
      reportedSpending: res.totalSpent,
      populationContributionDays: res.contribution.populationContributionDays,
    },
  };
}
