/**
 * 혜일) 여행 조건·지역 추천(홈화면) API 연동
 * 대응 노션 표: 여행 조건 옵션 조회(공개) / 조건 기반 지역 추천(POST, 인증 필요)
 * 백엔드 소스: back-main(develop) — recommendation/controller/TravelOptionsController.java,
 *              recommendation/controller/RegionRecommendationController.java
 *
 * 주의: 백엔드 PreferenceTag(HANOK_CONFUCIANISM/NATURE/SEA/WALKING/HEALING/FOOD/BICYCLE/HISTORY/NIGHT_SKY)와
 * CompanionType(SOLO/COUPLE/FRIENDS/FAMILY) 코드값은 프론트 기존 mock(TagKey, CompanionType)과 다르다.
 * 화면의 선택지는 /api/travel-options 응답을 그대로 써서(코드값 드리프트 방지), 로컬 하드코딩 목록(data/tags.ts,
 * HomePage의 COMPANIONS)은 더 이상 추천 API 호출에 사용하지 않는다.
 */
import { apiFetch } from "./apiClient";

export interface OptionItem {
  code: string;
  label: string;
}

export interface TravelOptionsResponse {
  preferenceTags: OptionItem[];
  preferenceSelection: { minimum: number; maximum: number };
  companionTypes: OptionItem[];
  stayDuration: { minimumNights: number; maximumNights: number };
}

export interface RegionRecommendationRequest {
  preferenceTags: string[]; // travel-options의 preferenceTags[].code 값
  companionType: string; // travel-options의 companionTypes[].code 값
  nights: number;
}

export interface RegionRecommendation {
  rank: number;
  regionId: number;
  regionName: string;
  thumbnailUrl: string | null;
  identityStatement: string;
  matchedTags: string[];
  recommendationReason: string;
  representativePlaces: string[];
}

export interface RegionRecommendationResponse {
  criteria: {
    preferenceTags: string[];
    companionType: string;
    nights: number;
  };
  recommendations: RegionRecommendation[];
}

/**
 * 프론트 로컬 태그(TagKey) → 백엔드 PreferenceTag 코드.
 * "festival"은 대응하는 백엔드 코드가 없어 제외한다.
 */
const TAG_KEY_TO_PREFERENCE_TAG: Record<string, string> = {
  hanok: "HANOK_CONFUCIANISM",
  nature: "NATURE",
  sea: "SEA",
  walk: "WALKING",
  healing: "HEALING",
  food: "FOOD",
  bike: "BICYCLE",
};

/** 백엔드는 1~3개의 PreferenceTag만 받으므로 변환 후 3개로 자른다. */
export function toPreferenceTags(tagKeys: readonly string[]): string[] {
  return tagKeys
    .map((key) => TAG_KEY_TO_PREFERENCE_TAG[key])
    .filter(Boolean)
    .slice(0, 3);
}

/** 여행 조건 옵션 조회 — 인증 불필요(공개 API) */
export function getTravelOptions(): Promise<TravelOptionsResponse> {
  return apiFetch<TravelOptionsResponse>("/api/travel-options", { auth: false });
}

/**
 * 조건 기반 지역 추천 — 인증 필요.
 * preferenceTags는 1~3개, 중복 불가(서버가 400으로 검증), nights는 1~7.
 */
export function recommendRegions(
  request: RegionRecommendationRequest
): Promise<RegionRecommendationResponse> {
  return apiFetch<RegionRecommendationResponse>("/api/regions/recommendations", {
    method: "POST",
    body: request,
  });
}

export interface RegionGalleryResponse {
  regionId: number;
  regionName: string;
  photos: Array<{
    contentId: number;
    title: string;
    imageUrl: string;
    address: string | null;
  }>;
  source: string;
  fetchedAt: string;
}

/** 지역 대표 사진 목록 — 공개 API(로그인 불필요) */
export function getRegionGallery(regionId: number): Promise<RegionGalleryResponse> {
  return apiFetch<RegionGalleryResponse>(`/api/regions/${regionId}/gallery`, { auth: false });
}

export interface StatsSummaryResponse {
  totalTrips: number;
  totalTravelers: number;
  totalPopulationContributionDays: number;
  totalSpending: number;
  totalStayHours: number;
  topRegions: Array<{
    rank: number;
    regionId: number;
    regionName: string;
    tripCount: number;
    populationContributionDays: number;
  }>;
  calculatedAt: string;
}

/** 서비스 전체 누적 기여 현황 — 공개 API(로그인 불필요) */
export function getStatsSummary(): Promise<StatsSummaryResponse> {
  return apiFetch<StatsSummaryResponse>("/api/stats/summary", { auth: false });
}
