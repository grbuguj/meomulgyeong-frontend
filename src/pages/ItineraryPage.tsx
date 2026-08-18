import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { REGION_MAP } from "../data/regions";
import { generateItinerary, regenerateItinerary, regeneratePlaceItem } from "../lib/itinerary";
import { makeTripCompletion } from "../lib/contribution";
import type { CompanionType, Itinerary } from "../types";
import { useApp } from "../store/AppContext";

const CATEGORY_LABEL: Record<string, string> = {
  attraction: "관광",
  food: "식사",
  experience: "체험",
  stay: "휴식",
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  attraction: { bg: "var(--color-mint-soft)", text: "#0a8a65" },
  food: { bg: "var(--color-amber-soft)", text: "#b96210" },
  experience: { bg: "#ede8fb", text: "#6b3ec9" },
  stay: { bg: "var(--color-ivory-warm)", text: "var(--color-ink-muted)" },
};

export default function ItineraryPage() {
  const { regionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { saveItinerary, savedItineraries, completeTrip, user } = useApp();

  const region = regionId ? REGION_MAP[regionId] : undefined;
  const nights = Number(params.get("nights") ?? 1);
  const companion = (params.get("companion") as CompanionType) ?? "alone";

  const [itin, setItin] = useState<Itinerary>(() =>
    region ? generateItinerary(region, nights, companion) : ({} as Itinerary)
  );
  const [activeDay, setActiveDay] = useState(1);
  const [completeModal, setCompleteModal] = useState(false);
  const [visitors, setVisitors] = useState(1);
  const [stayDays, setStayDays] = useState(itin.days?.length ?? 1);

  const isSaved = useMemo(() => savedItineraries.some((i) => i.id === itin.id), [savedItineraries, itin.id]);

  if (!region) {
    return (
      <div className="p-6" style={{ color: "var(--color-ink-soft)" }}>
        지역 정보를 찾을 수 없어요.
      </div>
    );
  }

  const day = itin.days.find((d) => d.day === activeDay) ?? itin.days[0];

  const handleSwap = (itemId: string) => {
    setItin((prev) => ({
      ...prev,
      days: prev.days.map((d) =>
        d.day !== activeDay
          ? d
          : {
              ...d,
              items: d.items.map((it) =>
                it.id === itemId ? regeneratePlaceItem(region, it, Math.random() * 100) : it
              ),
            }
      ),
    }));
  };

  const handleRegenerateAll = () => {
    setItin((prev) => regenerateItinerary(prev, region));
  };

  const handleSave = () => {
    saveItinerary(itin);
  };

  const handleComplete = () => {
    const trip = makeTripCompletion({ ...itin, days: itin.days.slice(0, stayDays) }, visitors);
    completeTrip(trip);
    setCompleteModal(false);
    navigate(`/trip-result/${user.trips.length}`, {
      state: { trip, itinerary: itin },
    });
  };

  return (
    <>
      <TopBar
        title={`${region.shortName} ${nights}박 ${nights + 1}일`}
        onBack
        right={
          <button
            onClick={handleSave}
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
                  {d.weather.temp}° {d.weather.condition}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="px-5 mt-4 space-y-2.5">
          {day.items.map((item, idx) => {
            const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.stay;
            return (
              <div
                key={item.id}
                className="rounded-[20px] p-4 flex gap-3"
                style={{
                  background: "white",
                  boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)",
                  animation: `fadeSlideUp ${0.22 + idx * 0.06}s cubic-bezier(0.16,1,0.3,1) both`,
                }}
              >
                <div
                  className="text-[11px] font-bold w-11 pt-0.5 shrink-0"
                  style={{ color: "var(--color-ink-faint)" }}
                >
                  {item.time}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: catStyle.bg, color: catStyle.text }}
                    >
                      {CATEGORY_LABEL[item.category]}
                    </span>
                    <p
                      className="text-[14px] font-bold"
                      style={{ color: "var(--color-ink)" }}
                    >
                      {item.name}
                    </p>
                  </div>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    {item.description}
                  </p>
                </div>
                {item.category !== "stay" && (
                  <button
                    onClick={() => handleSwap(item.id)}
                    className="text-[11px] font-bold self-start shrink-0 tap"
                    style={{ color: "var(--color-accent)" }}
                  >
                    교체 ↻
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 mt-5">
          <Button variant="secondary" fullWidth onClick={handleRegenerateAll}>
            일정 전체 재생성
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
          <Button variant="accent" fullWidth onClick={handleComplete}>
            지역 기여도 확인하기
          </Button>
        </div>
      </Modal>
    </>
  );
}
