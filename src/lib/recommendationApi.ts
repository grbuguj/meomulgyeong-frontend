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
