import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import TagChip from "../components/TagChip";
import Button from "../components/Button";
import RegionCard from "../components/RegionCard";
import StepDots from "../components/StepDots";
import DateRangeCalendar from "../components/DateRangeCalendar";
import Icon from "../components/Icon";
import { REGIONS, REGION_MAP } from "../data/regions";
import type { Region } from "../types";
import { useApp } from "../store/AppContext";
import {
  getTravelOptions,
  recommendRegions,
  type OptionItem,
  type RegionRecommendation,
  type TravelOptionsResponse,
} from "../lib/recommendationApi";
import { ApiError } from "../lib/apiClient";
import { diffDays, formatKoreanDate, parseISODate } from "../lib/date";

// 태그 코드(백엔드 PreferenceTag) → 이모지. travel-options가 신규 코드를 내려도
// 안 깨지도록 기본 이모지로 폴백한다.
const TAG_EMOJI: Record<string, string> = {
  HANOK_CONFUCIANISM: "🏯",
  NATURE: "🌲",
  SEA: "🌊",
  WALKING: "🥾",
  HEALING: "🍃",
  FOOD: "🍚",
  BICYCLE: "🚲",
  HISTORY: "🏛️",
  NIGHT_SKY: "✨",
};
const DEFAULT_TAG_EMOJI = "📍";

const COMPANION_EMOJI: Record<string, string> = {
  SOLO: "🧍",
  FAMILY: "👨‍👩‍👧",
  COUPLE: "💑",
  FRIENDS: "👯",
};
const DEFAULT_COMPANION_EMOJI = "🙂";

const STEPS: { key: "tags" | "nights" | "companion" | "result"; index: number }[] = [
  { key: "tags", index: 0 },
  { key: "nights", index: 1 },
  { key: "companion", index: 2 },
  { key: "result", index: 3 },
];

type Step = "tags" | "nights" | "companion" | "result";

/**
 * 추천 API 응답(regionName 등)을 기존 mock REGIONS(지역 상세 목업)와 이름으로 매칭해
 * RegionCard가 기대하는 전체 Region 형태를 구성한다.
 * 지역 상세 정보 자체는 다른 파트(③ 지역 스토리 API)의 영역이라, 매칭 실패 시에는
 * 추천 API가 준 필드만으로 최소한의 표시용 Region을 만들어 화면이 깨지지 않게 한다.
 */
function toDisplayRegion(rec: RegionRecommendation): Region {
  const matched = REGIONS.find((r) => r.name === rec.regionName || r.shortName === rec.regionName);
  if (matched) return matched;

  return {
    id: `api-${rec.regionId}`,
    backendId: rec.regionId,
    name: rec.regionName,
    shortName: rec.regionName,
    identityLine: rec.identityStatement,
    summary: rec.recommendationReason,
    description: rec.recommendationReason,
    tags: [],
    travelStyle: "",
    localTip: "",
    heroPalette: ["#4a6b52", "#93a86b"],
    heroImage: rec.thumbnailUrl ?? undefined,
    isVerifiedHub: false,
    representativeSpots: rec.representativePlaces,
  };
}

/** 받침 유무에 따라 조사를 고른다. 한글 음절은 유니코드상 28개 종성 단위로 배열돼 있다. */
function josa(word: string, withFinal: string, withoutFinal: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return withoutFinal;
  return (code - 0xac00) % 28 > 0 ? withFinal : withoutFinal;
}

/** "으로 / 로" 는 받침이 ㄹ일 때도 "로"를 쓴다. */
function ro(word: string): string {
  const code = word.trim().slice(-1).charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "로";
  const finalConsonant = (code - 0xac00) % 28;
  return finalConsonant === 0 || finalConsonant === 8 ? "로" : "으로";
}

/**
 * 추천 근거 문장.
 * 서버가 주는 recommendationReason은 지역 설명이라 "내가 고른 조건과 왜 맞는지"가 드러나지 않는다.
 *
 * 순위별로 같은 틀에 단어만 바꿔 넣으면 세 장이 똑같이 읽히므로,
 * 추천마다 실제로 다른 점(취향이 몇 개 맞았는지, 기간이 넉넉한지, 어떤 장소가 있는지)을
 * 골라 문장의 구조 자체를 다르게 만든다.
 */
function buildMatchStory(
  rec: RegionRecommendation,
  input: {
    nickname: string;
    tagLabels: Map<string, string>;
    selectedTagCount: number;
    companionLabel: string;
    nights: number;
  }
): { headline: string; body: string } {
  const matched = rec.matchedTags.map((code) => input.tagLabels.get(code) ?? code).filter(Boolean);
  const [firstPlace, secondPlace] = rec.representativePlaces;
  const short = rec.regionName.replace(/(시|군)$/, "");
  const withCompanion = `${input.companionLabel}${josa(input.companionLabel, "과", "와")}`;
  const nightsText = `${input.nights}박 ${input.nights + 1}일`;
  const identity = rec.identityStatement.replace(/\.$/, "");
  const tagList = matched.join(" · ");

  // 1순위 — 고른 취향이 출발점. 사용자의 선택을 되짚는 말로 연다.
  if (rec.rank === 1) {
    return {
      headline: `${input.nickname}님 취향에 가장 가까워요`,
      body:
        (tagList ? `${tagList}${josa(tagList, "을", "를")} 고르셨죠. ` : "") +
        `${short}${josa(short, "은", "는")} ${identity}${ro(identity)} 불리는 곳이에요. ` +
        (firstPlace
          ? `${firstPlace}부터 잡으면 ${nightsText}이 빠듯하지 않습니다.`
          : `${nightsText} 일정에 무리가 없어요.`),
    };
  }

  // 2순위 — 장소가 출발점. 어디를 보게 되는지로 연다.
  if (rec.rank === 2) {
    return {
      headline: firstPlace ? `${firstPlace}, 여기가 궁금하다면` : `이런 선택지도 있어요`,
      body:
        `${short}${josa(short, "은", "는")} ${identity}. ` +
        (secondPlace
          ? `${withCompanion} 간다면 ${firstPlace}${josa(firstPlace ?? "", "과", "와")} ${secondPlace}${josa(secondPlace, "을", "를")} 묶어 도는 쪽이 편해요.`
          : `${withCompanion} 가는 ${nightsText}에 맞춰 동선을 담았어요.`),
    };
  }

  // 3순위 이하 — 앞의 두 곳과 무엇이 다른지로 연다.
  return {
    headline: `앞의 두 곳과는 결이 달라요`,
    body:
      (tagList ? `${tagList} 쪽에서도 이름이 있지만, 분위기가 다릅니다. ` : "") +
      `${identity}. ` +
      (firstPlace
        ? `${input.nights >= 3 ? `${nightsText}이면 ` : ""}${firstPlace} 한 곳에 오래 머물러도 아깝지 않아요.`
        : `천천히 머물기 좋은 곳이에요.`),
  };
}

export default function PlanPage() {
  const { user, setSelection } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState<Step>("tags");

  // 지역 상세에서 "이 지역으로 일정 만들기"로 들어온 경우 지역이 이미 정해져 있다.
  // 이때는 추천 단계를 건너뛰고, 날짜·동행만 받아 곧장 일정을 만든다.
  const fixedRegion = params.get("regionId") ? REGION_MAP[params.get("regionId")!] : undefined;
  const fixedBackendRegionId = Number(params.get("backendRegionId") ?? 0);

  const [options, setOptions] = useState<TravelOptionsResponse | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // 지역 상세에서 넘어온 경우 그 지역의 대표 태그를 미리 골라둔다(사용자가 바꿀 수 있음).
  const [tagCodes, setTagCodes] = useState<string[]>(() =>
    (params.get("tags") ?? "").split(",").filter(Boolean).slice(0, 3)
  );
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [companionCode, setCompanionCode] = useState<string | null>(null);

  const [results, setResults] = useState<RegionRecommendation[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // 화면 진입 시 여행 조건 옵션(태그/동행/체류일 범위)을 서버에서 받아온다 — 공개 API
  useEffect(() => {
    getTravelOptions()
      .then((res) => setOptions(res))
      .catch((e) => setOptionsError(e instanceof ApiError ? e.message : "여행 조건을 불러오지 못했어요."));
  }, []);

  const stepIndex = STEPS.find((s) => s.key === step)?.index ?? 0;
  const maxTags = options?.preferenceSelection.maximum ?? 3;
  const maxNights = Math.min(options?.stayDuration.maximumNights ?? 7, 7);
  const nights = startDate && endDate ? diffDays(parseISODate(startDate), parseISODate(endDate)) : 0;

  const toggleTag = (code: string) => {
    setTagCodes((prev) => {
      if (prev.includes(code)) return prev.filter((x) => x !== code);
      if (prev.length >= maxTags) return prev;
      return [...prev, code];
    });
  };

  /**
   * 일정 생성 화면으로 이동한다.
   * 백엔드 POST /api/itineraries는 startDate·nights·preferenceTags·companionType이 모두 필수라,
   * 여기서 모은 값을 빠짐없이 넘긴다(기본값을 대신 채우지 않는다).
   */
  const goToItinerary = (frontendRegionId: string, backendRegionId: number, companion: string) => {
    if (!startDate || nights < 1) return;
    const query = new URLSearchParams({
      startDate,
      nights: String(nights),
      companion,
      backendRegionId: String(backendRegionId),
      tags: tagCodes.join(","),
    });
    navigate(`/itinerary/${frontendRegionId}?${query.toString()}`);
  };

  const runMatch = async (finalCompanionCode: string) => {
    setMatching(true);
    setMatchError(null);
    try {
      const res = await recommendRegions({
        preferenceTags: tagCodes,
        companionType: finalCompanionCode,
        nights,
      });
      setResults(res.recommendations);
      // 다른 화면(일정 생성 등)에서 참고할 수 있도록 로컬 태그 코드 기준으로 최근 선택을 남겨둔다.
      setSelection([], nights, "alone");
      setStep("result");
    } catch (e) {
      setMatchError(e instanceof ApiError ? e.message : "지역 추천에 실패했어요. 다시 시도해주세요.");
    } finally {
      setMatching(false);
    }
  };

  const reset = () => {
    setStep("tags");
    setTagCodes([]);
    setStartDate(null);
    setEndDate(null);
    setCompanionCode(null);
    setResults([]);
    setMatchError(null);
  };

  const companionOptions: OptionItem[] = options?.companionTypes ?? [];
  const tagOptions: OptionItem[] = options?.preferenceTags ?? [];

  // 추천 근거 문장에서 서버 코드(NATURE 등) 대신 사람이 읽는 라벨을 쓰기 위한 표
  const tagLabelMap = new Map(tagOptions.map((t) => [t.code, t.label]));
  const selectedCompanionLabel =
    companionOptions.find((c) => c.code === companionCode)?.label ?? "함께";

  return (
    <>
      <TopBar
        title={fixedRegion ? `${fixedRegion.name} 일정` : step === "result" ? "추천 지역" : "머물;경"}
        onBack={Boolean(fixedRegion) || (step !== "tags" && step !== "result")}
        right={
          step !== "tags" ? (
            <button
              onClick={reset}
              className="text-[11.5px] font-bold tap"
              style={{ color: "var(--color-ink-muted)" }}
            >
              처음부터
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
        {step !== "result" && <StepDots total={3} current={stepIndex} />}

        {optionsError && (
          <p className="text-[12px] font-semibold mb-3" style={{ color: "#c0392b" }}>
            {optionsError}
          </p>
        )}

        {/* ── STEP 1: 취향 태그 ── */}
        {step === "tags" && (
          <div className="animate-in">
            <p
              className="text-[13px] font-bold mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              {fixedRegion ? `${fixedRegion.name}으로 떠나요` : `${user.nickname}님, 반가워요 👋`}
            </p>
            <h2
              className="text-[27px] font-extrabold mb-1.5 leading-tight tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              오늘의 취향을
              <br />
              골라주세요
            </h2>
            <p
              className="text-[13px] mb-5 font-medium"
              style={{ color: "var(--color-ink-soft)" }}
            >
              최대 {maxTags}개까지 선택할 수 있어요 · {tagCodes.length}/{maxTags}
            </p>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((t) => (
                <TagChip
                  key={t.code}
                  label={t.label}
                  emoji={TAG_EMOJI[t.code] ?? DEFAULT_TAG_EMOJI}
                  active={tagCodes.includes(t.code)}
                  disabled={!tagCodes.includes(t.code) && tagCodes.length >= maxTags}
                  onClick={() => toggleTag(t.code)}
                />
              ))}
            </div>
            <Button
              fullWidth
              variant="accent"
              className="mt-10"
              disabled={tagCodes.length === 0}
              onClick={() => setStep("nights")}
            >
              다음 →
            </Button>
          </div>
        )}

        {/* ── STEP 2: 날짜 선택 ── */}
        {step === "nights" && (
          <div className="animate-in">
            <h2
              className="text-[27px] font-extrabold mb-1.5 leading-tight tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              며칠 머무를까요?
            </h2>
            <p
              className="text-[13px] mb-5 font-medium"
              style={{ color: "var(--color-ink-soft)" }}
            >
              체크인·체크아웃 날짜를 골라주세요 · 최대 {maxNights}박까지
            </p>

            <div
              className="rounded-[22px] p-4 mb-4"
              style={{
                background: "white",
                boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)",
              }}
            >
              <DateRangeCalendar
                startDate={startDate}
                endDate={endDate}
                maxNights={maxNights}
                onChange={(next) => {
                  setStartDate(next.startDate);
                  setEndDate(next.endDate);
                }}
              />
            </div>

            <div
              className="rounded-2xl px-4 py-3.5 mb-6 text-center"
              style={{ background: "var(--color-accent-soft)" }}
            >
              {startDate && endDate ? (
                <p className="text-[13.5px] font-bold" style={{ color: "var(--color-accent-dark)" }}>
                  {formatKoreanDate(parseISODate(startDate))} → {formatKoreanDate(parseISODate(endDate))} ·{" "}
                  {nights}박 {nights + 1}일
                </p>
              ) : startDate ? (
                <p className="text-[13px] font-semibold" style={{ color: "var(--color-accent-dark)" }}>
                  체크인 {formatKoreanDate(parseISODate(startDate))} · 체크아웃 날짜를 골라주세요
                </p>
              ) : (
                <p className="text-[13px] font-semibold" style={{ color: "var(--color-ink-soft)" }}>
                  체크인 날짜부터 골라주세요
                </p>
              )}
            </div>

            <Button
              fullWidth
              variant="accent"
              disabled={!startDate || !endDate}
              onClick={() => setStep("companion")}
            >
              다음 →
            </Button>
          </div>
        )}

        {/* ── STEP 3: 동행 ── */}
        {step === "companion" && (
          <div className="animate-in">
            <h2
              className="text-[27px] font-extrabold mb-1.5 leading-tight tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              누구와 함께
              <br />
              가시나요?
            </h2>
            <p
              className="text-[13px] mb-5 font-medium"
              style={{ color: "var(--color-ink-soft)" }}
            >
              {fixedRegion
                ? "동행 형태에 맞춰 일정을 구성해드려요"
                : "동행 형태에 맞춰 지역을 추천해드려요"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {companionOptions.map((c) => {
                const isActive = companionCode === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => setCompanionCode(c.code)}
                    className="py-7 rounded-3xl flex flex-col items-center gap-2 tap"
                    style={
                      isActive
                        ? {
                            background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                            color: "white",
                            boxShadow: "0 10px 28px -10px rgba(43,108,224,0.58)",
                          }
                        : {
                            background: "white",
                            color: "var(--color-ink)",
                            boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.1)",
                          }
                    }
                  >
                    <span className="text-3xl">{COMPANION_EMOJI[c.code] ?? DEFAULT_COMPANION_EMOJI}</span>
                    <div className="text-center">
                      <p className="text-[14px] font-bold leading-none">{c.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {matchError && (
              <p className="text-[12px] font-semibold mt-4" style={{ color: "#c0392b" }}>
                {matchError}
              </p>
            )}
            <Button
              fullWidth
              variant="accent"
              className="mt-10"
              disabled={!companionCode || matching}
              onClick={() => {
                if (!companionCode) return;
                if (fixedRegion) {
                  goToItinerary(fixedRegion.id, fixedBackendRegionId || (fixedRegion.backendId ?? 0), companionCode);
                  return;
                }
                runMatch(companionCode);
              }}
            >
              {fixedRegion
                ? `${fixedRegion.shortName} 일정 만들기`
                : matching
                ? "추천 받는 중…"
                : "지역 추천 받기"}
            </Button>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === "result" && (
          <div className="animate-in space-y-3">
            <div className="mb-4">
              <p
                className="text-[13px] font-bold mb-1"
                style={{ color: "var(--color-accent)" }}
              >
                {user.nickname}님을 위한 맞춤 추천
              </p>
              <h2
                className="text-[24px] font-extrabold tracking-tight"
                style={{ color: "var(--color-ink)" }}
              >
                추천 지역 {results.length}곳
              </h2>
              <p
                className="text-[13px] mt-1"
                style={{ color: "var(--color-ink-soft)" }}
              >
                선택한 조건과 가장 잘 맞는 순서예요
              </p>
            </div>
            {results.map((rec) => {
              const story = buildMatchStory(rec, {
                nickname: user.nickname,
                tagLabels: tagLabelMap,
                selectedTagCount: tagCodes.length,
                companionLabel: selectedCompanionLabel,
                nights,
              });
              return (
                <div key={rec.regionId} className="space-y-2">
                  <RegionCard
                    region={toDisplayRegion(rec)}
                    reason={rec.recommendationReason}
                    onClick={() =>
                      goToItinerary(toDisplayRegion(rec).id, rec.regionId, companionCode ?? "SOLO")
                    }
                  />
                  <div
                    className="rounded-[18px] px-4 py-3"
                    style={{ background: "var(--color-accent-soft)" }}
                  >
                    <p
                      className="text-[11.5px] font-extrabold mb-1 flex items-center gap-1.5"
                      style={{ color: "var(--color-accent-dark)" }}
                    >
                      <Icon name="sparkles" size={13} />
                      {story.headline}
                    </p>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: "var(--color-ink-soft)" }}
                    >
                      {story.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
