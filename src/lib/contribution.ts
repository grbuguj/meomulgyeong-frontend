import type { Itinerary, TripCompletion } from "../types";

// 한국관광공사 「국민여행조사」 1인 1일 평균 지출액(숙박·식음료·체험활동) 참고 — mock 단가
const PER_DAY_SPEND = {
  lodging: 45000,
  food: 32000,
  activity: 18000,
};

/**
 * 여행 결과 기반 지역 기여도 산출
 * - 예상 소비 금액 = (숙박+식음료+체험 단가) × 활동 수 × 체류일수
 * - 생활인구 산입 일수 = 행안부 「인구감소지역 지원 특별법」 시행령 체류기준(1일 이상 체류 시 산입) 적용
 */
export function calcContribution(itinerary: Itinerary, visitors: number) {
  const days = itinerary.days.length;
  const perDayTotal = PER_DAY_SPEND.lodging + PER_DAY_SPEND.food + PER_DAY_SPEND.activity;
  const estimatedSpend = perDayTotal * days * visitors;
  const stayHours = days * 14; // 체류시간 근사(1일 약 14시간 활동 가정)
  const livingPopulationDays = days; // 1일 이상 체류 시 그대로 산입

  return {
    visitedRegions: 1,
    stayHours,
    estimatedSpend,
    livingPopulationDays,
  };
}

export function makeTripCompletion(itinerary: Itinerary, visitors: number): TripCompletion {
  return {
    itineraryId: itinerary.id,
    regionId: itinerary.regionId,
    visitedDays: itinerary.days.length,
    visitors,
    completedAt: new Date().toISOString(),
  };
}
