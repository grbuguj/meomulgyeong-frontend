import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import ItineraryMobility from "../components/ItineraryMobility";
import Icon from "../components/Icon";
import { LogoMark } from "../components/Logo";
import { josa } from "../lib/korean";
import { REGION_MAP } from "../data/regions";
import type { DayPlan, Itinerary, PlaceItem, TripCompletion } from "../types";
import { useApp } from "../store/AppContext";
import {
  bookmarkItinerary,
  completeItinerary,
  createItinerary,
  getItineraryRoutes,
  getOperationInfo,
  getItinerary,
  regenerateFullItinerary,
  replaceItineraryItem,
  toBackendCompanion,
  toFrontendItinerary,
  toTripCompletion,
  type ItineraryRoutesResponse,
  type OperationInfoResponse,
  type TransportMode,
} from "../lib/itineraryApi";
import { ApiError } from "../lib/apiClient";
import { ESTIMATED_SPEND_PER_PERSON_DAY } from "../lib/contribution";

const CATEGORY_LABEL: Record<string, string> = {
  attraction: "관광",
  food: "식사",
  experience: "체험",
  stay: "휴식",
  transit: "이동",
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  attraction: { bg: "var(--color-mint-soft)", text: "#0a8a65" },
  food: { bg: "var(--color-amber-soft)", text: "#b96210" },
  experience: { bg: "#ede8fb", text: "#6b3ec9" },
  stay: { bg: "var(--color-ivory-warm)", text: "var(--color-ink-muted)" },
  transit: { bg: "var(--color-ivory-warm)", text: "var(--color-ink-muted)" },
};

function weatherText(weather: DayPlan["weather"]): string {
  const range = [
    weather.minimumTemperature !== null ? `최저 ${weather.minimumTemperature}°` : null,
    weather.maximumTemperature !== null ? `최고 ${weather.maximumTemperature}°` : null,
  ].filter(Boolean);
  return [range.join(" / "), weather.condition ?? "날씨 미정"].filter(Boolean).join(" ");
}

/**
 * 숫자 입력 필드.
 * 값을 숫자로만 들고 있으면 지웠을 때 곧바로 0으로 되돌아가 수정이 어렵다.
 * 입력 중에는 문자열 초안을 그대로 두고, 포커스가 빠질 때 범위에 맞춰 정리한다.
 */
function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max,
  step,
  unit,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  const clamp = (n: number) => Math.max(min, max === undefined ? n : Math.min(n, max));

  return (
    <div>
      <label className="text-[12px] font-bold block mb-1.5" style={{ color: "var(--color-ink-soft)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const next = Number(e.target.value);
            if (e.target.value !== "" && Number.isFinite(next)) onChange(clamp(next));
          }}
          onBlur={() => {
            const next = draft === "" || !Number.isFinite(Number(draft)) ? min : clamp(Number(draft));
            onChange(next);
            setDraft(String(next));
          }}
          className={`w-full rounded-2xl px-4 py-3 outline-none font-semibold ${unit ? "pr-12" : ""}`}
          style={{ background: "var(--color-ivory-warm)", color: "var(--color-ink)" }}
        />
        {unit && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold pointer-events-none"
            style={{ color: "var(--color-ink-faint)" }}
          >
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[10.5px] mt-1.5" style={{ color: "var(--color-ink-faint)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * 금액 입력 필드.
 * 금액은 자릿수가 커서 숫자만 늘어놓으면 얼마를 적었는지 읽기 어렵다.
 * 천 단위로 끊어 보여주고, 자주 쓰는 단위를 눌러 더할 수 있게 한다.
 */
function AmountField({
  label,
  value,
  onChange,
  suggestion,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  /** 기억이 안 나는 경우를 위한 제안액. 누르면 그 값으로 덮어쓴다. */
  suggestion?: number;
}) {
  const QUICK_ADDS = [10000, 50000, 100000];
  const MAX = 100_000_000;

  return (
    <div>
      <label className="text-[12px] font-bold block mb-1.5" style={{ color: "var(--color-ink-soft)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? "" : value.toLocaleString("ko-KR")}
          placeholder="0"
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, "");
            onChange(digits === "" ? 0 : Math.min(Number(digits), MAX));
          }}
          className="w-full rounded-2xl pl-4 pr-10 py-3 outline-none font-bold text-[17px] text-right"
          style={{ background: "var(--color-ivory-warm)", color: "var(--color-ink)" }}
        />
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold pointer-events-none"
          style={{ color: "var(--color-ink-faint)" }}
        >
          원
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {QUICK_ADDS.map((amount) => (
          <button
            key={amount}
            onClick={() => onChange(Math.min(value + amount, MAX))}
            className="rounded-full px-3 py-1.5 text-[11.5px] font-bold tap"
            style={{ background: "white", color: "var(--color-ink)", border: "1.5px solid var(--color-line)" }}
          >
            +{(amount / 10000).toLocaleString("ko-KR")}만
          </button>
        ))}
        {value > 0 && (
          <button
            onClick={() => onChange(0)}
            className="rounded-full px-3 py-1.5 text-[11.5px] font-bold tap"
            style={{ background: "transparent", color: "var(--color-ink-faint)" }}
          >
            지우기
          </button>
        )}
      </div>

      {value > 0 ? (
        <p className="text-[10.5px] mt-2" style={{ color: "var(--color-ink-faint)" }}>
          {(value / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원 · 지역 소비로 집계돼요
        </p>
      ) : (
        <p className="text-[10.5px] mt-2" style={{ color: "var(--color-ink-faint)" }}>
          숙박·식사·체험에 쓴 금액이에요.
        </p>
      )}

      {suggestion !== undefined && suggestion > 0 && value !== suggestion && (
        <button
          onClick={() => onChange(suggestion)}
          className="mt-2 rounded-full px-3.5 py-2 text-[11.5px] font-bold tap"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}
        >
          기억이 안 나면 예상 {Math.round(suggestion / 10000).toLocaleString("ko-KR")}만원으로
        </button>
      )}
    </div>
  );
}

/**
 * 출처·한계 고지.
 * 관광 정보와 예보는 원본이 바뀌거나 현장과 다를 수 있어, 화면과 인쇄본 양쪽에 함께 표기한다.
 */
function SourceNote({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style}>
      <p>· 장소 정보 ⓒ한국관광공사 「국문 관광정보 서비스」</p>
      <p>· 날씨 기상청 단기예보 — 발표 시점 기준 예보값입니다.</p>
      <p>· 영업시간·휴무일은 변동될 수 있습니다. 방문 전 해당 장소에 확인해주세요.</p>
    </div>
  );
}

export default function ItineraryPage() {
  const { regionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // 완료한 여행 기록에서 열면 그때의 기여도 수치가 함께 넘어온다.
  // 이 경우 일정은 이미 굳어진 기록이라 저장·완료가 아니라 결과를 보여줘야 한다.
  const completedTrip = (location.state as { completedTrip?: TripCompletion } | null)?.completedTrip;
  const { saveItinerary, removeSavedItinerary, savedItineraries, completeTrip, user } = useApp();

  const region = regionId ? REGION_MAP[regionId] : undefined;
  const companionParam = params.get("companion") ?? "SOLO";
  const backendRegionId = Number(params.get("backendRegionId") ?? 0);
  const preferenceTags = (params.get("tags") ?? "").split(",").filter(Boolean);
  // 생성에 필요한 값은 기본값으로 채우지 않는다.
  // 백엔드는 startDate·nights를 필수로 받고, 생성 후에는 날짜를 바꿀 수단이 없다.
  // 임의의 날짜로 만들어두면 축제 매칭·날씨·휴무 판정이 전부 엉뚱한 기간 기준으로 동작한다.
  const nights = Number(params.get("nights") ?? 0);
  const startDateParam = params.get("startDate");

  const [itin, setItin] = useState<Itinerary | null>(null);
  const [backendItineraryId, setBackendItineraryId] = useState<number | null>(null);
  /** 일정이 다시 짜일 때마다 서버가 올려주는 값. 경로를 다시 받을 시점을 판단한다. */
  const [generationVersion, setGenerationVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingDates, setMissingDates] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [completeModal, setCompleteModal] = useState(false);
  const [visitors, setVisitors] = useState(1);
  const [stayDays, setStayDays] = useState(1);
  const [totalSpent, setTotalSpent] = useState(0);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ src: string; name: string } | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("CAR");
  const [routes, setRoutes] = useState<ItineraryRoutesResponse | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [routeComparison, setRouteComparison] = useState<Partial<Record<TransportMode, ItineraryRoutesResponse>> | null>(null);
  const [comparingRoutes, setComparingRoutes] = useState(false);
  const [placeDetail, setPlaceDetail] = useState<{ item: PlaceItem; info: OperationInfoResponse | null } | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  const created = useRef(false);

  useEffect(() => {
    if (!region || created.current) return;
    created.current = true;

    // itineraryId 파라미터가 있으면 기존 저장 일정 조회, 없으면 새로 생성
    const savedItineraryId = Number(params.get("itineraryId") ?? 0);

    // 방금 생성한 일정의 항목은 백엔드가 DB에 flush하기 전 상태로 응답해 itemId가 비어있다
    // (교체 버튼을 누르면 NaN 오류가 남). 생성 직후 한 번 더 조회해 실제 itemId를 받아온다.
    let load: Promise<Awaited<ReturnType<typeof getItinerary>>>;
    if (savedItineraryId) {
      load = getItinerary(savedItineraryId);
    } else {
      // 새로 만드는 경우 날짜·박수가 없으면 요청 자체를 보내지 않는다.
      if (!startDateParam || nights < 1) {
        setMissingDates(true);
        setLoading(false);
        return;
      }
      load = createItinerary({
        regionId: backendRegionId,
        companionType: toBackendCompanion(companionParam),
        nights,
        startDate: startDateParam,
        preferenceTags,
      }).then((res) => getItinerary(res.itineraryId));
    }

    load
      .then((res) => {
        const frontendItin = toFrontendItinerary(res, regionId!);
        setItin(frontendItin);
        setBackendItineraryId(res.itineraryId);
        setGenerationVersion(res.generationVersion);
        setStayDays(frontendItin.days.length);
        setActiveDay(1);
        // 저장 목록에서 "일정 완료"로 들어온 경우 바로 완료 입력을 띄운다.
        if (params.get("complete") === "1") setCompleteModal(true);
      })
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : "일정을 불러오지 못했어요. 다시 시도해주세요.");
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSaved = useMemo(
    () => (itin ? savedItineraries.some((i) => i.id === itin.id) : false),
    [savedItineraries, itin]
  );

  // 금액을 기억 못 하는 경우가 많아 한국관광공사 1인 1일 평균 지출액 기준 예상액을 제안한다.
  // 기본값으로 밀어 넣지는 않는다 — 실제로 쓴 값이 아닌 수치가 기여도로 집계되면 안 된다.
  const suggestedSpend = stayDays * visitors * ESTIMATED_SPEND_PER_PERSON_DAY;

  // 저장 확인 문구는 잠시만 띄운다. 저장 여부 자체는 상단 북마크 버튼 색으로 계속 보인다.
  useEffect(() => {
    if (!savedNotice) return;
    const timer = setTimeout(() => setSavedNotice(false), 3000);
    return () => clearTimeout(timer);
  }, [savedNotice]);

  const day = useMemo(
    () => itin?.days.find((candidate) => candidate.day === activeDay) ?? itin?.days[0] ?? null,
    [itin, activeDay]
  );
  const activeDayNumber = day?.day;

  useEffect(() => {
    if (!backendItineraryId || !activeDayNumber) return;
    let cancelled = false;
    setRoutesLoading(true);
    setRoutesError(null);
    setRoutes(null);
    getItineraryRoutes(backendItineraryId, activeDayNumber, transportMode)
      .then((response) => {
        if (!cancelled) setRoutes(response);
      })
      .catch((requestError) => {
        if (!cancelled) setRoutesError(requestError instanceof ApiError ? requestError.message : "이동 경로를 불러오지 못했어요.");
      })
      .finally(() => {
        if (!cancelled) setRoutesLoading(false);
      });
    return () => { cancelled = true; };
  // generationVersion을 함께 본다. 재생성·교체를 해도 일정 id와 날짜는 그대로라
  // 이 값이 없으면 장소만 바뀌고 경로·지도는 이전 것이 남는다.
  }, [backendItineraryId, activeDayNumber, transportMode, generationVersion]);

  if (!region) {
    return (
      <div className="p-6" style={{ color: "var(--color-ink-soft)" }}>
        지역 정보를 찾을 수 없어요.
      </div>
    );
  }

  if (missingDates) {
    const query = new URLSearchParams({
      regionId: region.id,
      backendRegionId: String(backendRegionId || region.backendId || 0),
      tags: preferenceTags.join(","),
    });
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-[15px] font-bold" style={{ color: "var(--color-ink)" }}>
          여행 날짜를 먼저 골라주세요
        </p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
          일정은 여행 날짜를 기준으로 축제·날씨·휴무일을 반영해 만들어져요.
          <br />
          만든 뒤에는 날짜를 바꿀 수 없어요.
        </p>
        <Button
          variant="accent"
          className="mt-3"
          onClick={() => navigate(`/plan?${query.toString()}`, { replace: true })}
        >
          날짜 고르기
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: "var(--color-ink-soft)" }}>
        <p className="text-[13px] font-semibold">일정을 만드는 중이에요…</p>
      </div>
    );
  }

  if (error || !itin || !day) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[14px] font-bold" style={{ color: "var(--color-ink)" }}>
          일정 생성 실패
        </p>
        <p className="text-[12.5px]" style={{ color: "var(--color-ink-soft)" }}>
          {error ?? "알 수 없는 오류가 발생했어요."}
        </p>
        <button
          className="text-[12.5px] font-bold underline mt-1"
          style={{ color: "var(--color-accent)" }}
          onClick={() => navigate(-1)}
        >
          돌아가기
        </button>
      </div>
    );
  }

  const handleSwap = async (itemId: string) => {
    if (!backendItineraryId || swapping) return;
    const numericItemId = Number(itemId);
    if (!Number.isFinite(numericItemId)) {
      setActionError("이 항목은 아직 교체할 수 없어요. 화면을 새로고침한 뒤 다시 시도해주세요.");
      return;
    }
    setSwapping(itemId);
    setActionError(null);
    try {
      const res = await replaceItineraryItem(backendItineraryId, numericItemId);
      const updated = await getItinerary(res.itineraryId);
      setItin(toFrontendItinerary(updated, regionId!));
      setGenerationVersion(updated.generationVersion);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "장소를 교체하지 못했어요. 다시 시도해주세요.");
    } finally {
      setSwapping(null);
    }
  };

  const handleRegenerateAll = async () => {
    if (!backendItineraryId || regenerating) return;
    setRegenerating(true);
    setActionError(null);
    try {
      // 재생성 직후 응답도 항목 itemId가 비어있을 수 있어 한 번 더 조회한다 (위 최초 로드와 동일한 이유).
      await regenerateFullItinerary(backendItineraryId);
      const res = await getItinerary(backendItineraryId);
      setItin(toFrontendItinerary(res, regionId!));
      setGenerationVersion(res.generationVersion);
      // 이전 일정 기준으로 받아둔 수단 비교 결과는 더 이상 맞지 않는다
      setRouteComparison(null);
      setActiveDay(1);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "일정을 다시 만들지 못했어요. 다시 시도해주세요.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCompareRoutes = async () => {
    if (!backendItineraryId || !day || comparingRoutes) return;
    setComparingRoutes(true);
    try {
      const [car, transit] = await Promise.all([
        getItineraryRoutes(backendItineraryId, day.day, "CAR"),
        getItineraryRoutes(backendItineraryId, day.day, "TRANSIT"),
      ]);
      setRouteComparison({ CAR: car, TRANSIT: transit });
    } catch (requestError) {
      setRoutesError(requestError instanceof ApiError ? requestError.message : "수단을 비교하지 못했어요.");
    } finally {
      setComparingRoutes(false);
    }
  };

  const handleOpenPlaceDetail = async (item: PlaceItem) => {
    if (!backendItineraryId || !Number.isFinite(Number(item.id))) return;
    setPlaceDetail({ item, info: null });
    setOperationLoading(true);
    setOperationError(null);
    try {
      const info = await getOperationInfo(backendItineraryId, Number(item.id));
      setPlaceDetail({ item, info });
    } catch (requestError) {
      setOperationError(requestError instanceof ApiError ? requestError.message : "운영 정보를 불러오지 못했어요.");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!backendItineraryId || bookmarkLoading) return;
    setBookmarkLoading(true);
    setActionError(null);
    try {
      if (isSaved) {
        await removeSavedItinerary(itin.id, backendItineraryId);
        setSavedNotice(false);
      } else {
        await bookmarkItinerary(backendItineraryId);
        saveItinerary(itin);
        // 저장한 일정이 어디로 갔는지 바로 보여준다. 마이페이지에서 방금 저장한 항목을 짚어준다.
        navigate("/my", { state: { highlightItineraryId: itin.id } });
      }
    } catch (e) {
      const fallback = isSaved
        ? "저장을 해제하지 못했어요. 다시 시도해주세요."
        : "일정을 저장하지 못했어요. 다시 시도해주세요.";
      setActionError(e instanceof ApiError ? e.message : fallback);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!backendItineraryId || completing) return;
    setCompleting(true);
    setActionError(null);
    try {
      const res = await completeItinerary(backendItineraryId, {
        stayHours: stayDays * 24,
        partySize: visitors,
        totalSpent,
      });
      const trip = toTripCompletion(res, regionId!, stayDays, visitors, {
        title: `${region.name} ${itin.nights}박 ${itin.nights + 1}일`,
        startDate: itin.days[0]?.date,
        endDate: itin.days[itin.days.length - 1]?.date,
        nights: itin.nights,
      });
      completeTrip(trip);
      setCompleteModal(false);
      navigate(`/trip-result/${user.trips.length}`, {
        state: { trip, itinerary: itin },
      });
    } catch (e) {
      // 서버 등록이 실패하면 완료로 처리하지 않는다 — 로컬만 완료 표시하면 기록이 사라진다.
      setActionError(
        e instanceof ApiError ? e.message : "여행 완료를 등록하지 못했어요. 다시 시도해주세요."
      );
    } finally {
      setCompleting(false);
    }
  };

  return (
    <>
      <TopBar
        title={`${region.shortName} ${itin.nights}박 ${itin.nights + 1}일`}
        onBack
        right={
          completedTrip ? undefined : (
          <button
            onClick={handleToggleSave}
            disabled={bookmarkLoading}
            aria-pressed={isSaved}
            aria-label={isSaved ? "저장 해제하기" : "일정 저장하기"}
            title={isSaved ? "저장됨 · 누르면 저장 해제" : "일정 저장하기"}
            className="w-9 h-9 rounded-full flex items-center justify-center tap"
            style={
              isSaved
                ? {
                    background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                    color: "white",
                    boxShadow: "0 4px 12px -4px rgba(43,108,224,0.55)",
                  }
                : {
                    background: "white",
                    color: "var(--color-ink)",
                    boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 14px -6px rgba(28,26,22,0.08)",
                  }
            }
          >
            <Icon name="bookmark" size={18} filled={isSaved} />
          </button>
          )
        }
      />
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1"
            style={{ background: "var(--color-ivory-warm)" }}
          >
            <LogoMark size={20} />
            <span
              className="font-serif-kr text-[12px] font-bold tracking-tight leading-none"
              style={{ color: "#1E4E8C" }}
            >
              머물<span style={{ color: "#FF8F5A" }}>;</span>경이 짠 일정
            </span>
          </span>
          <h2
            className="text-[22px] font-extrabold mt-2 tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            {region.shortName}
            {josa(region.shortName, "을", "를")} 천천히.
          </h2>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {region.identityLine}
          </p>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 px-5 overflow-x-auto scrollbar-thin pb-1">
          {itin.days.map((d) => {
            const isActive = activeDay === d.day;
            return (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className="min-w-[104px] px-4 py-3 rounded-2xl text-[14px] font-extrabold tap shrink-0"
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                        color: "white",
                        boxShadow: "0 6px 16px -6px rgba(43,108,224,0.5)",
                      }
                    : {
                        background: "white",
                        color: "var(--color-ink-soft)",
                        boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 14px -6px rgba(28,26,22,0.08)",
                      }
                }
              >
                Day {d.day}
                <br />
                <span className="text-[11px] font-semibold opacity-90">{weatherText(d.weather)}</span>
              </button>
            );
          })}
        </div>

        {/* 완료한 여행 기록으로 들어온 경우 — 이 일정이 남긴 결과를 함께 보여준다 */}
        {completedTrip && (
          <div
            className="mx-5 mt-4 rounded-[22px] p-4"
            style={{
              background: "linear-gradient(140deg, #3b82f6 0%, var(--color-accent-dark) 100%)",
              boxShadow: "0 10px 26px -12px rgba(43,108,224,0.55)",
            }}
          >
            <p className="text-[11.5px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
              다녀온 여행 · {new Date(completedTrip.completedAt).toLocaleDateString("ko-KR")} 완료
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                ["머문 날", `${completedTrip.contribution?.populationContributionDays ?? completedTrip.visitedDays}일`],
                ["함께한 사람", `${completedTrip.visitors}명`],
                [
                  "쓴 금액",
                  `${(((completedTrip.contribution?.estimatedSpending ?? completedTrip.contribution?.reportedSpending) ?? 0) / 10000).toFixed(0)}만원`,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.72)" }}>
                    {label}
                  </p>
                  <p className="text-[16px] font-extrabold text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                navigate("/trip-result/completed", { state: { trip: completedTrip, itinerary: itin } })
              }
              className="mt-3.5 w-full rounded-xl py-2.5 text-[12.5px] font-extrabold tap"
              style={{ background: "rgba(255,255,255,0.18)", color: "white" }}
            >
              이 여행이 남긴 자국 자세히 보기
            </button>
          </div>
        )}

        {itin.warnings?.map((warning) => (
          <div
            key={warning.code}
            className="mx-5 mt-3 rounded-2xl px-4 py-3 text-[12px] font-semibold"
            style={{ background: "var(--color-amber-soft)", color: "#b96210" }}
          >
            {warning.message}
          </div>
        ))}

        {actionError && (
          <p className="px-5 mt-3 text-[12px] font-semibold" style={{ color: "#c2410c" }}>
            {actionError}
          </p>
        )}

        {savedNotice && (
          <div
            className="mx-5 mt-3 rounded-2xl px-4 py-3 flex items-center gap-2 text-[12px] font-semibold animate-in"
            style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}
          >
            <Icon name="bookmark" size={14} filled />
            일정을 저장했어요 · 마이페이지에서 다시 볼 수 있어요
          </div>
        )}

        <ItineraryMobility
          part="map"
          mode={transportMode}
          items={day.items}
          route={routes}
          loading={routesLoading}
          error={routesError}
          comparison={routeComparison}
          comparing={comparingRoutes}
          onModeChange={setTransportMode}
          onCompare={handleCompareRoutes}
        />

        {/* Timeline */}
        <div className="px-5 mt-4 space-y-2.5">
          {day.items.map((item, idx) => {
            const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.stay;
            const isSwapping = swapping === item.id;
            // 실제 장소 카드만 대표 이미지를 보여준다. 이동·휴식은 타임라인을 빠르게 훑을 수 있도록 텍스트형으로 유지한다.
            const showPlaceImage = Boolean(item.imageUrl) && !["transit", "stay"].includes(item.category);
            const hasSupportingText = Boolean(item.description || item.address);
            const canOpenMap = !["transit", "stay"].includes(item.category);
            const canOpenOperation = !["transit", "stay"].includes(item.category);
            const canReplace = item.replaceable ?? (item.category !== "stay" && item.category !== "transit");
            const mapQuery = encodeURIComponent([item.name, item.address].filter(Boolean).join(" "));
            return (
              <div
                key={item.id}
                className="relative rounded-[22px] overflow-hidden"
                style={{
                  background: "white",
                  boxShadow: "0 2px 6px rgba(28,26,22,0.05), 0 14px 30px -14px rgba(28,26,22,0.2)",
                  animation: `fadeSlideUp ${0.22 + idx * 0.06}s cubic-bezier(0.16,1,0.3,1) both`,
                  opacity: isSwapping ? 0.5 : 1,
                }}
              >
                {/* 장소 사진은 카드 위에 크게 깐다. 작은 썸네일로는 어디인지 가늠이 안 된다. */}
                {showPlaceImage && item.imageUrl && (
                  <button
                    onClick={() => setImagePreview({ src: item.imageUrl!, name: item.name })}
                    className="block w-full h-[168px] tap"
                    aria-label={`${item.name} 사진 크게 보기`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={`${item.name} 대표 이미지`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.parentElement?.remove();
                      }}
                    />
                  </button>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[12px] font-extrabold"
                      style={{ background: "var(--color-ivory-warm)", color: "var(--color-ink-muted)" }}
                      aria-label={`일정 ${idx + 1}번째`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className="inline-flex whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: catStyle.bg, color: catStyle.text }}
                      >
                        {CATEGORY_LABEL[item.category]}
                      </span>
                      <p
                        className="text-[18px] font-extrabold leading-snug mt-1.5 tracking-tight"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {item.name}
                      </p>
                    </div>
                    {canReplace && (
                      <button
                        onClick={() => handleSwap(item.id)}
                        disabled={!!swapping}
                        className="shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-bold tap"
                        style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}
                      >
                        {isSwapping ? "교체 중…" : "교체 ↻"}
                      </button>
                    )}
                  </div>

                  {hasSupportingText && (
                    <div className="mt-2.5 pl-[34px]">
                      {item.description && (
                        <p
                          className="text-[13px] leading-relaxed"
                          style={{
                            color: "var(--color-ink-soft)",
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      {item.address && (
                        <p
                          className="text-[11.5px] leading-snug mt-1"
                          style={{ color: "var(--color-ink-faint)" }}
                          title={item.address}
                        >
                          📍 {item.address}
                        </p>
                      )}
                    </div>
                  )}

                  {(canOpenMap || canOpenOperation) && (
                    <div className="flex items-center gap-2 mt-3 pl-[34px]">
                      {canOpenMap && (
                        <a
                          href={`https://map.naver.com/p/search/${mapQuery}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full px-3 py-2 text-[11.5px] font-bold tap"
                          style={{ background: "var(--color-ivory-warm)", color: "var(--color-ink-soft)" }}
                        >
                          네이버지도 ↗
                        </a>
                      )}
                      {canOpenMap && (
                        <a
                          href={`https://map.kakao.com/link/search/${mapQuery}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full px-3 py-2 text-[11.5px] font-bold tap"
                          style={{ background: "var(--color-ivory-warm)", color: "var(--color-ink-soft)" }}
                        >
                          카카오맵 ↗
                        </a>
                      )}
                      {canOpenOperation && (
                        <button
                          onClick={() => handleOpenPlaceDetail(item)}
                          className="rounded-full px-3 py-2 text-[11.5px] font-bold tap"
                          style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}
                        >
                          운영정보
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <ItineraryMobility
          part="detail"
          mode={transportMode}
          route={routes}
          loading={routesLoading}
          error={routesError}
          comparison={routeComparison}
          comparing={comparingRoutes}
          onModeChange={setTransportMode}
          onCompare={handleCompareRoutes}
        />

        <div className="px-5 mt-5 grid grid-cols-2 gap-2.5">
          <Button variant="secondary" onClick={handleRegenerateAll} disabled={regenerating}>
            {regenerating ? "재생성 중…" : "전체 재생성"}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            인쇄 · PDF
          </Button>
        </div>

        <p className="px-5 mt-2 text-[10.5px] leading-relaxed" style={{ color: "var(--color-ink-faint)" }}>
          통신이 불안정한 지역을 대비해 일정을 PDF로 저장해두세요.
        </p>

        <div className="px-5 mt-4 text-[10px] leading-relaxed" style={{ color: "var(--color-ink-faint)" }}>
          <SourceNote className="space-y-0.5" />
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="sticky bottom-0 px-4 py-4"
        style={{
          background: "linear-gradient(to top, var(--color-ivory) 75%, transparent)",
        }}
      >
        {/* 방금 만든 일정에 "여행 완료"를 띄우면 아직 가지도 않은 여행을 끝내라는 말이 된다.
            저장 전에는 저장을, 저장한 뒤(=다녀올 일정이 된 뒤)에 완료를 권한다. */}
        {completedTrip ? (
          <Button variant="secondary" fullWidth onClick={() => window.print()}>
            이 일정 인쇄 · PDF 저장
          </Button>
        ) : isSaved ? (
          <Button variant="accent" fullWidth onClick={() => setCompleteModal(true)}>
            다녀왔어요 · 여행 완료
          </Button>
        ) : (
          <Button variant="accent" fullWidth onClick={handleToggleSave} disabled={bookmarkLoading}>
            {bookmarkLoading ? "저장 중…" : "이 일정 저장하기"}
          </Button>
        )}
      </div>

      {/* 인쇄 · PDF 저장용 문서 — 화면에는 보이지 않고, 인쇄 시 모든 날짜가 한 번에 출력된다 */}
      <div className="print-sheet">
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>
          {region.name} {itin.nights}박 {itin.nights + 1}일
        </h1>
        <p style={{ fontSize: 11, marginBottom: 16 }}>{region.identityLine}</p>

        {itin.days.map((d) => (
          <section key={d.day} className="print-day" style={{ marginBottom: 18 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 700,
                borderBottom: "1px solid #000",
                paddingBottom: 3,
                marginBottom: 8,
              }}
            >
              Day {d.day} · {d.date} · {weatherText(d.weather)}
            </h2>
            <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {d.items.map((item, idx) => (
                <li
                  key={item.id}
                  className="print-item"
                  style={{ display: "flex", gap: 8, fontSize: 11, marginBottom: 7 }}
                >
                  <span style={{ width: 14, flexShrink: 0 }}>{idx + 1}.</span>
                  <div>
                    <div>
                      <strong>{item.name}</strong>
                      <span style={{ marginLeft: 6, fontSize: 9.5 }}>
                        [{CATEGORY_LABEL[item.category]}]
                      </span>
                    </div>
                    {item.address && <div style={{ fontSize: 9.5 }}>{item.address}</div>}
                    {item.description && <div style={{ fontSize: 9.5 }}>{item.description}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <SourceNote style={{ fontSize: 8.5, marginTop: 20, lineHeight: 1.6 }} />
      </div>

      {/* Complete modal */}
      <Modal open={completeModal} onClose={() => setCompleteModal(false)} title="여행을 완료했어요 🎉">
        <div className="space-y-4">
          <NumberField
            label="머문 일자"
            unit="일"
            min={1}
            max={itin.days.length}
            value={stayDays}
            onChange={setStayDays}
          />
          <NumberField label="방문 인원" unit="명" min={1} value={visitors} onChange={setVisitors} />
          <AmountField
            label="쓴 금액"
            value={totalSpent}
            onChange={setTotalSpent}
            suggestion={suggestedSpend}
          />
          {actionError && (
            <p className="text-[12px] font-semibold" style={{ color: "#c2410c" }}>
              {actionError}
            </p>
          )}
          <Button variant="accent" fullWidth onClick={handleComplete} disabled={completing}>
            {completing ? "처리 중…" : "지역 기여도 확인하기"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(imagePreview)}
        onClose={() => setImagePreview(null)}
        title={imagePreview?.name ?? "장소 이미지"}
      >
        {imagePreview && (
          <img
            src={imagePreview.src}
            alt={`${imagePreview.name} 대표 이미지`}
            className="w-full max-h-[58vh] object-contain rounded-2xl"
            onError={() => setImagePreview(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(placeDetail)}
        onClose={() => {
          setPlaceDetail(null);
          setOperationError(null);
        }}
        title={placeDetail?.item.name ?? "장소 운영정보"}
      >
        <div className="space-y-3">
          {operationLoading && <p className="text-[12px] font-semibold" style={{ color: "var(--color-ink-muted)" }}>운영 정보를 불러오는 중…</p>}
          {operationError && <p className="text-[12px] font-semibold" style={{ color: "#c2410c" }}>{operationError}</p>}
          {!operationLoading && placeDetail?.info && (
            <>
              {placeDetail.info.status === "OK" ? (
                <>
                  <div className="rounded-2xl px-4 py-3" style={{ background: "var(--color-ivory-warm)" }}>
                    <p className="text-[10px] font-extrabold" style={{ color: "var(--color-ink-faint)" }}>이용시간</p>
                    <p className="mt-1 whitespace-pre-line text-[12px] font-semibold leading-relaxed" style={{ color: "var(--color-ink)" }}>{placeDetail.info.useTime ?? "등록된 이용시간이 없어요."}</p>
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ background: "var(--color-ivory-warm)" }}>
                    <p className="text-[10px] font-extrabold" style={{ color: "var(--color-ink-faint)" }}>휴무일</p>
                    <p className="mt-1 whitespace-pre-line text-[12px] font-semibold leading-relaxed" style={{ color: "var(--color-ink)" }}>{placeDetail.info.restDate ?? "등록된 휴무일이 없어요."}</p>
                  </div>
                </>
              ) : (
                <p className="rounded-2xl px-4 py-3 text-[12px] font-semibold" style={{ background: "var(--color-ivory-warm)", color: "var(--color-ink-soft)" }}>
                  {placeDetail.info.status === "NOT_SUPPORTED" ? "이 일정 항목은 운영정보 조회 대상이 아니에요." : placeDetail.info.status === "NO_DATA" ? "등록된 운영정보가 없어요." : "운영정보를 불러오지 못했어요."}
                </p>
              )}
              {placeDetail.info.closedDayWarning && (
                <div className="rounded-2xl px-4 py-3" style={{ background: "var(--color-amber-soft)", color: "#a9570d" }}>
                  <p className="text-[12px] font-extrabold">⚠ 휴무 가능성</p>
                  <p className="mt-1 text-[11px] leading-relaxed font-semibold">{placeDetail.info.closedDayWarning.message}</p>
                  {placeDetail.item.replaceable && (
                    <button
                      onClick={() => {
                        handleSwap(placeDetail.item.id);
                        setPlaceDetail(null);
                      }}
                      className="mt-2 text-[11px] font-extrabold underline underline-offset-2 tap"
                    >
                      이 장소 교체하기
                    </button>
                  )}
                </div>
              )}
              <p className="text-[9.5px] leading-relaxed" style={{ color: "var(--color-ink-faint)" }}>{placeDetail.info.notice} · {placeDetail.info.source}</p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
