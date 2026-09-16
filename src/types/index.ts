export type TagKey =
  | "hanok"
  | "nature"
  | "sea"
  | "walk"
  | "healing"
  | "food"
  | "bike"
  | "festival";

export interface TagInfo {
  key: TagKey;
  label: string;
  emoji: string;
}

export type CompanionType = "alone" | "family" | "couple" | "friend";

export interface Region {
  id: string;
  name: string; // 안동시
  shortName: string; // 안동
  identityLine: string; // 한 문장 정체성 문구
  summary: string; // 한줄 요약
  description: string; // 상세 설명
  tags: TagKey[];
  travelStyle: string; // 여행 성격
  localTip: string; // 현지인 꿀정보
  heroPalette: [string, string]; // gradient colors
  heroImage?: string; // real photo URL (optional fallback to SVG art)
  isVerifiedHub: boolean; // 안동 대표 검증 거점 여부
  representativeSpots: string[];
  /** 백엔드 region_id. 일정 생성 API가 이 값을 요구하므로 모든 지역에 채워져 있어야 한다. */
  backendId: number;
}

export interface PlaceItem {
  id: string;
  regionId: string;
  name: string;
  category: "attraction" | "food" | "stay" | "experience" | "transit";
  time: string;
  description: string;
  imageUrl?: string | null;
  address?: string | null;
  /** 서버가 판단한 교체 가능 여부. 없으면 카테고리로 추론한다. */
  replaceable?: boolean;
}

export interface DayPlan {
  day: number;
  date: string;
  weather: {
    minimumTemperature: number | null;
    maximumTemperature: number | null;
    condition: string | null;
  };
  items: PlaceItem[];
}

export interface Itinerary {
  id: string;
  regionId: string;
  /** 백엔드 itinerary_id (정수). API 호출(교체/재생성/완료/북마크)에 사용한다. */
  backendItineraryId?: number;
  nights: number;
  companion: CompanionType;
  days: DayPlan[];
  savedAt?: string;
  /** 서버가 내려준 경고(예: 축제 데이터 없음). 사용자에게 그대로 노출한다. */
  warnings?: { code: string; message: string }[];
}

/** 서버가 계산한 지역 기여도. 없으면 프론트가 추정치를 계산한다. */
export interface TripContribution {
  stayHours: number;
  /** 사용자가 입력한 실제 지출. 완료 등록 응답에만 있다. */
  reportedSpending?: number;
  /** 서버가 산출한 예상 소비. 마이페이지 완료여행 목록에만 있다. */
  estimatedSpending?: number;
  populationContributionDays: number | null;
}

export interface TripCompletion {
  itineraryId: string;
  regionId: string;
  visitedDays: number;
  visitors: number;
  completedAt: string;
  contribution?: TripContribution;
}

export interface UserProfile {
  nickname: string;
  name: string;
  email: string | null;
  loginProvider: "google" | "kakao" | "naver" | null;
  stamps: string[]; // regionIds visited
  savedItineraries: string[]; // itinerary ids
  trips: TripCompletion[];
}
