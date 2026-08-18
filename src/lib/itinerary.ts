import type { CompanionType, DayPlan, Itinerary, PlaceItem, Region } from "../types";

const WEATHER_POOL = [
  { condition: "맑음", tempRange: [18, 30] },
  { condition: "구름조금", tempRange: [15, 26] },
  { condition: "비", tempRange: [12, 20] },
  { condition: "흐림", tempRange: [14, 22] },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function mockWeather(seed: number) {
  const w = pick(WEATHER_POOL, seed);
  const [min, max] = w.tempRange;
  const temp = min + ((seed * 7) % (max - min + 1));
  return { temp, condition: w.condition };
}

const ATTRACTION_SLOTS = ["09:00", "10:30", "14:00", "15:30"];
const FOOD_SLOTS = ["12:00", "18:30"];

function buildDay(region: Region, day: number, seed: number): DayPlan {
  const items: PlaceItem[] = [];

  // 오전 관광지
  const spot1 = region.representativeSpots[(day + seed) % region.representativeSpots.length];
  items.push({
    id: `${region.id}-d${day}-a1`,
    regionId: region.id,
    name: spot1,
    category: "attraction",
    time: ATTRACTION_SLOTS[0],
    description: `${region.shortName}의 대표 명소, ${spot1}에서 여유롭게 둘러보기`,
  });

  // 점심
  items.push({
    id: `${region.id}-d${day}-f1`,
    regionId: region.id,
    name: `${region.shortName} 로컬 맛집`,
    category: "food",
    time: FOOD_SLOTS[0],
    description: "지역 향토 음식으로 든든하게 채우는 점심",
  });

  // 오후 관광지 or 체험
  const spot2 = region.representativeSpots[(day + seed + 1) % region.representativeSpots.length];
  items.push({
    id: `${region.id}-d${day}-a2`,
    regionId: region.id,
    name: spot2,
    category: day % 2 === 0 ? "experience" : "attraction",
    time: ATTRACTION_SLOTS[2],
    description: `${spot2}에서 이어지는 오후 일정`,
  });

  // 저녁
  items.push({
    id: `${region.id}-d${day}-f2`,
    regionId: region.id,
    name: `${region.shortName} 저녁 식당`,
    category: "food",
    time: FOOD_SLOTS[1],
    description: "하루를 마무리하는 저녁 식사",
  });

  // 숙소 — 노션 기능명세 규칙: 상세 정보 없이 [휴식]으로 단순 표기
  items.push({
    id: `${region.id}-d${day}-stay`,
    regionId: region.id,
    name: "휴식",
    category: "stay",
    time: "21:00",
    description: "오늘 머무는 숙소에서 휴식",
  });

  return {
    day,
    date: `Day ${day}`,
    weather: mockWeather(seed + day),
    items,
  };
}

export function generateItinerary(
  region: Region,
  nights: number,
  companion: CompanionType,
  seed = Date.now() % 97
): Itinerary {
  const totalDays = nights === 0 ? 1 : nights + 1;
  const days: DayPlan[] = [];
  for (let d = 1; d <= totalDays; d++) {
    days.push(buildDay(region, d, seed + d));
  }
  return {
    id: `itin-${region.id}-${seed}`,
    regionId: region.id,
    nights,
    companion,
    days,
  };
}

/** 개별 장소 교체: 해당 항목만 새 후보로 교체 */
export function regeneratePlaceItem(region: Region, item: PlaceItem, seed: number): PlaceItem {
  if (item.category === "stay") return item; // 숙소는 교체 대상 아님
  const candidates = region.representativeSpots.filter((s) => s !== item.name);
  const next = candidates.length ? pick(candidates, seed) : item.name;
  return {
    ...item,
    name: item.category === "food" ? `${region.shortName} 다른 맛집` : next,
    description: `새로 추천된 ${item.category === "food" ? "맛집" : "장소"}입니다`,
  };
}

/** 전체 재생성: 출도착지·숙소를 제외한 나머지 일정을 새로 생성 */
export function regenerateItinerary(itin: Itinerary, region: Region): Itinerary {
  const newSeed = (Date.now() + Math.random() * 1000) % 97;
  const newDays = itin.days.map((d) => {
    const rebuilt = buildDay(region, d.day, Math.floor(newSeed) + d.day);
    return {
      ...rebuilt,
      weather: d.weather, // 날씨는 유지 (이미 결정된 날짜 기준)
    };
  });
  return { ...itin, days: newDays };
}
