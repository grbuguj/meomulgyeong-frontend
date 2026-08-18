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
  isVerifiedHub: boolean; // 안동 대표 검증 거점 여부
  representativeSpots: string[];
}

export interface PlaceItem {
  id: string;
  regionId: string;
  name: string;
  category: "attraction" | "food" | "stay" | "experience";
  time: string;
  description: string;
}

export interface DayPlan {
  day: number;
  date: string;
  weather: { temp: number; condition: string };
  items: PlaceItem[];
}

export interface Itinerary {
  id: string;
  regionId: string;
  nights: number;
  companion: CompanionType;
  days: DayPlan[];
  savedAt?: string;
}

export interface TripCompletion {
  itineraryId: string;
  regionId: string;
  visitedDays: number;
  visitors: number;
  completedAt: string;
}

export interface UserProfile {
  nickname: string;
  loginProvider: "google" | "kakao" | "naver" | null;
  stamps: string[]; // regionIds visited
  savedItineraries: string[]; // itinerary ids
  trips: TripCompletion[];
}
