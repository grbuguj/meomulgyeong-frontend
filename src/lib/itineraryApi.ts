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
  // TODO: 백엔드 실제 스펙 확인 필요 — regionId 타입(정수 vs 문자열), 필드명 확인
  regionId: number;
  companionType: BackendCompanionType;
  nights: number;
  // TODO: 백엔드 실제 스펙 확인 필요 — startDate 필수 여부, 생략 시 오늘 날짜 기본값 여부
  startDate: string; // "YYYY-MM-DD"
}

export interface ItineraryItemResponse {
  itemId: number;
  sequenceNo: number;
  itemType: BackendItemType;
  placeName: string;
  placeDescription: string;
  // TODO: 백엔드 실제 스펙 확인 필요 — 표시 시간(displayTime/startTime) 필드 반환 여부
}

export interface ItineraryDayResponse {
  day: number;
  date: string; // "YYYY-MM-DD"
  items: ItineraryItemResponse[];
}

export interface ItineraryResponse {
  itineraryId: number;
  regionId: number;
  regionName: string; // TODO: 백엔드 실제 스펙 확인 필요 — regionName 포함 여부
  companionType: BackendCompanionType;
  nights: number;
  startDate: string;
  // TODO: 백엔드 실제 스펙 확인 필요 — status enum 값("ACTIVE"/"COMPLETED" 등)
  status: string;
  days: ItineraryDayResponse[];
  bookmarked?: boolean; // TODO: 백엔드 실제 스펙 확인 필요 — 북마크 여부 포함 여부
}

export interface ReplaceItemRequest {
  // TODO: 백엔드 실제 스펙 확인 필요 — 교체 조건(제외할 장소ID 등) 있는지 확인
}

export interface ReplaceItemResponse {
  // TODO: 백엔드 실제 스펙 확인 필요 — 단일 아이템 반환인지 전체 일정 반환인지 확인
  item?: ItineraryItemResponse;
  itinerary?: ItineraryResponse;
}

export interface CompleteItineraryRequest {
  // TODO: 백엔드 실제 스펙 확인 필요 — 실제 필드명(visitedDays/stayDays 등) 확인
  visitors: number;
  visitedDays: number;
}

export interface CompleteItineraryResponse {
  // TODO: 백엔드 실제 스펙 확인 필요 — 응답 필드 확인
  itineraryId: number;
  regionId: number;
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
  ARRIVAL: "stay",
  REST: "stay",
  DEPARTURE: "stay",
};

// TODO: 백엔드 실제 스펙 확인 필요 — 백엔드가 시간 필드를 주지 않으면 sequence_no 기반 추정값을 사용
const SEQUENCE_TIMES: Record<number, string> = {
  1: "09:00",
  2: "11:00",
  3: "13:00",
  4: "15:00",
  5: "17:00",
  6: "19:00",
  7: "21:00",
};

function toFrontendItem(item: ItineraryItemResponse, regionId: string): PlaceItem {
  return {
    id: String(item.itemId),
    regionId,
    name: item.placeName,
    category: ITEM_CATEGORY_MAP[item.itemType] ?? "stay",
    time: SEQUENCE_TIMES[item.sequenceNo] ?? "09:00",
    description: item.placeDescription,
  };
}

function toFrontendDay(day: ItineraryDayResponse, regionId: string): DayPlan {
  return {
    day: day.day,
    date: day.date,
    // TODO: 백엔드 실제 스펙 확인 필요 — 날씨 정보 제공 여부. 현재는 placeholder
    weather: { temp: 23, condition: "맑음" },
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
    method: "PATCH",
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
    method: "POST",
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
  return apiFetch<CompleteItineraryResponse>(`/api/itineraries/${itineraryId}/complete`, {
    method: "POST",
    body: req,
  });
}

/** 8. 내 일정 목록 조회 (저장된 일정) */
// TODO: 백엔드 실제 스펙 확인 필요 — 엔드포인트 및 필터 파라미터(bookmarked 등) 확인
export async function listMyItineraries(): Promise<ItineraryResponse[]> {
  return apiFetch<ItineraryResponse[]>("/api/itineraries");
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
  };
}
