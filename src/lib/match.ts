import type { CompanionType, Region, TagKey } from "../types";
import { REGIONS } from "../data/regions";

/**
 * 사용자 조건 기반 지역 추천 — rule-based 가중합 매칭
 * (노션 기능명세 "가중치 매칭 로직" 기준: 지역 15개 규모에서는
 *  벡터 유사도보다 rule-based 가중합이 더 적합하다는 팀 결론을 반영)
 *
 * score = tagOverlap * 3 + companionBonus + hubBonus
 */
export function matchRegions(
  selectedTags: TagKey[],
  companion: CompanionType,
  nights: number
): Region[] {
  const scored = REGIONS.map((region) => {
    let score = 0;

    // 1) 태그 일치도 (가장 큰 비중)
    const overlap = region.tags.filter((t) => selectedTags.includes(t)).length;
    score += overlap * 3;

    // 2) 동행 형태 보정 (여행 성격 문자열 기반 간이 규칙)
    if (companion === "family" && region.tags.includes("healing")) score += 1;
    if (companion === "couple" && region.tags.includes("nature")) score += 1;
    if (companion === "friend" && (region.tags.includes("bike") || region.tags.includes("festival")))
      score += 1;
    if (companion === "alone" && region.tags.includes("walk")) score += 1;

    // 3) 체류 기간 보정 — 장기체류일수록 콘텐츠 다양성이 높은 지역 우대
    if (nights >= 3 && region.representativeSpots.length >= 4) score += 1;

    // 4) 데이터 검증 거점(안동) 소폭 가중 — 데이터 풀 충분
    if (region.isVerifiedHub) score += 0.5;

    return { region, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((s) => s.region);
}
