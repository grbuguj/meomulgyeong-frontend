import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { REGION_MAP } from "../data/regions";
import type { Itinerary } from "../types";
import { useApp } from "../store/AppContext";
import {
  bookmarkItinerary,
  completeItinerary,
  createItinerary,
  getItinerary,
  regenerateFullItinerary,
  replaceItineraryItem,
  toBackendCompanion,
  toFrontendItinerary,
  toTripCompletion,
} from "../lib/itineraryApi";
import { ApiError } from "../lib/apiClient";
import { toISODate, today } from "../lib/date";

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

export default function ItineraryPage() {
  const { regionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { saveItinerary, savedItineraries, completeTrip, user } = useApp();

  const region = regionId ? REGION_MAP[regionId] : undefined;
  const nights = Number(params.get("nights") ?? 1);
  const companionParam = params.get("companion") ?? "SOLO";
  const backendRegionId = Number(params.get("backendRegionId") ?? 0);
  const preferenceTags = (params.get("tags") ?? "").split(",").filter(Boolean);
  // 캘린더에서 날짜를 고르고 온 경우에만 startDate가 붙는다(예: 지역상세 "일정 만들기"는 아직 없음).
  // 없으면 오늘 날짜로 시작하는 것으로 취급한다.
  const startDateParam = params.get("startDate") ?? toISODate(today());

  const [itin, setItin] = useState<Itinerary | null>(null);
  const [backendItineraryId, setBackendItineraryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const created = useRef(false);

  useEffect(() => {
    if (!region || created.current) return;
    created.current = true;

    // itineraryId 파라미터가 있으면 기존 저장 일정 조회, 없으면 새로 생성
    const savedItineraryId = Number(params.get("itineraryId") ?? 0);

    // 방금 생성한 일정의 항목은 백엔드가 DB에 flush하기 전 상태로 응답해 itemId가 비어있다
    // (교체 버튼을 누르면 NaN 오류가 남). 생성 직후 한 번 더 조회해 실제 itemId를 받아온다.
    const load = savedItineraryId
      ? getItinerary(savedItineraryId)
      : createItinerary({
          regionId: backendRegionId,
          companionType: toBackendCompanion(companionParam),
          nights,
          startDate: startDateParam,
          preferenceTags,
        }).then((res) => getItinerary(res.itineraryId));

    load
      .then((res) => {
        const frontendItin = toFrontendItinerary(res, regionId!);
        setItin(frontendItin);
        setBackendItineraryId(res.itineraryId);
        setStayDays(frontendItin.days.length);
        setActiveDay(1);
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

  if (!region) {
    return (
      <div className="p-6" style={{ color: "var(--color-ink-soft)" }}>
        지역 정보를 찾을 수 없어요.
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

  if (error || !itin) {
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

  const day = itin.days.find((d) => d.day === activeDay) ?? itin.days[0];

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
      setActiveDay(1);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "일정을 다시 만들지 못했어요. 다시 시도해주세요.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSave = async () => {
    if (!backendItineraryId) return;
    if (isSaved) return;
    setBookmarkLoading(true);
    setActionError(null);
    try {
      await bookmarkItinerary(backendItineraryId);
      saveItinerary(itin);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "일정을 저장하지 못했어요. 다시 시도해주세요.");
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
      const trip = toTripCompletion(res, regionId!, stayDays, visitors);
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
        title={`${region.shortName} ${nights}박 ${nights + 1}일`}
        onBack
        right={
          <button
            onClick={handleSave}
            disabled={bookmarkLoading || isSaved}
            className="w-9 h-9 rounded-full bg-white card-soft flex items-center justify-center text-base tap"
          >
            {isSaved ? "🔖" : "📑"}
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <span
            className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase"
            style={{ color: "var(--color-accent)" }}
          >
            AUTO-PLAN
          </span>
          <h2
            className="text-[22px] font-extrabold mt-1 tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            {region.shortName}을 천천히.
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
                className="min-w-[80px] px-3 py-2.5 rounded-2xl text-xs font-bold tap shrink-0"
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
                <span className="font-semibold opacity-90">
                  {d.weather.temp !== null && `${d.weather.temp}° `}
                  {d.weather.condition ?? "날씨 미정"}
                </span>
              </button>
            );
          })}
        </div>

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

        {/* Timeline */}
        <div className="px-5 mt-4 space-y-2.5">
          {day.items.map((item, idx) => {
            const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.stay;
            const isSwapping = swapping === item.id;
            // 실제 장소 카드만 대표 이미지를 보여준다. 이동·휴식은 타임라인을 빠르게 훑을 수 있도록 텍스트형으로 유지한다.
            const showPlaceImage = Boolean(item.imageUrl) && !["transit", "stay"].includes(item.category);
            const hasSupportingText = Boolean(item.description || item.address);
            return (
              <div
                key={item.id}
                className={`relative rounded-[20px] p-3.5 flex gap-3 ${showPlaceImage || hasSupportingText ? "min-h-[92px]" : ""}`}
                style={{
                  background: "white",
                  boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)",
                  animation: `fadeSlideUp ${0.22 + idx * 0.06}s cubic-bezier(0.16,1,0.3,1) both`,
                  opacity: isSwapping ? 0.5 : 1,
                }}
              >
                <div
                  className="text-[11px] font-bold w-10 pt-1 shrink-0"
                  style={{ color: "var(--color-ink-faint)" }}
                >
                  {item.time}
                </div>
                <div className={`flex-1 min-w-0 ${item.replaceable ?? (item.category !== "stay" && item.category !== "transit") ? "pr-9" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: catStyle.bg, color: catStyle.text }}
                    >
                      {CATEGORY_LABEL[item.category]}
                    </span>
                    <p
                      className="text-[13.5px] font-bold leading-snug"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {item.name}
                    </p>
                  </div>
                  {item.description && (
                    <p
                      className="text-[11.5px] leading-relaxed"
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
                      className="text-[10.5px] leading-relaxed mt-0.5"
                      style={{
                        color: "var(--color-ink-faint)",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                      }}
                      title={item.address}
                    >
                      📍 {item.address}
                    </p>
                  )}
                </div>
                {showPlaceImage && (
                  <img
                    src={item.imageUrl ?? undefined}
                    alt={`${item.name} 대표 이미지`}
                    className="w-[72px] h-[72px] rounded-xl object-cover shrink-0"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}
                {(item.replaceable ?? (item.category !== "stay" && item.category !== "transit")) && (
                  <button
                    onClick={() => handleSwap(item.id)}
                    disabled={!!swapping}
                    className="absolute top-3.5 right-3.5 text-[11px] font-bold tap"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {isSwapping ? "…" : "교체 ↻"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 mt-5">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleRegenerateAll}
            disabled={regenerating}
          >
            {regenerating ? "재생성 중…" : "일정 전체 재생성"}
          </Button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="sticky bottom-0 px-4 py-4"
        style={{
          background: "linear-gradient(to top, var(--color-ivory) 75%, transparent)",
        }}
      >
        <Button variant="accent" fullWidth onClick={() => setCompleteModal(true)}>
          여행 완료
        </Button>
      </div>

      {/* Complete modal */}
      <Modal open={completeModal} onClose={() => setCompleteModal(false)} title="여행을 완료했어요 🎉">
        <div className="space-y-4">
          <div>
            <label
              className="text-[12px] font-bold block mb-1.5"
              style={{ color: "var(--color-ink-soft)" }}
            >
              머문 일자 (일)
            </label>
            <input
              type="number"
              min={1}
              max={itin.days.length}
              value={stayDays}
              onChange={(e) => setStayDays(Number(e.target.value))}
              className="w-full rounded-2xl px-4 py-3 outline-none font-semibold"
              style={{
                background: "var(--color-ivory-warm)",
                color: "var(--color-ink)",
              }}
            />
          </div>
          <div>
            <label
              className="text-[12px] font-bold block mb-1.5"
              style={{ color: "var(--color-ink-soft)" }}
            >
              방문 인원 (명)
            </label>
            <input
              type="number"
              min={1}
              value={visitors}
              onChange={(e) => setVisitors(Number(e.target.value))}
              className="w-full rounded-2xl px-4 py-3 outline-none font-semibold"
              style={{
                background: "var(--color-ivory-warm)",
                color: "var(--color-ink)",
              }}
            />
          </div>
          <div>
            <label
              className="text-[12px] font-bold block mb-1.5"
              style={{ color: "var(--color-ink-soft)" }}
            >
              쓴 금액 (원)
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={totalSpent}
              onChange={(e) => setTotalSpent(Math.max(Number(e.target.value), 0))}
              className="w-full rounded-2xl px-4 py-3 outline-none font-semibold"
              style={{
                background: "var(--color-ivory-warm)",
                color: "var(--color-ink)",
              }}
            />
          </div>
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
    </>
  );
}
