import type { ItineraryRoutesResponse, RouteSegment, TransportMode } from "../lib/itineraryApi";

const STATUS_COPY: Record<RouteSegment["status"], string> = {
  OK: "경로 확인",
  NEARBY: "도보 이동",
  NO_STOP: "정류장 없음 · 택시/자차 권장",
  NO_ROUTE: "경로 정보 없음",
  UNAVAILABLE: "경로를 불러오지 못했어요",
};

function formatMoney(value: number | null) {
  return value === null ? null : value === 0 ? "무료" : `${value.toLocaleString()}원`;
}

function RouteSketch({ segments }: { segments: RouteSegment[] }) {
  const points = segments.flatMap((segment) => segment.path ?? []);
  if (points.length < 2) return null;

  const latitudes = points.map(([lat]) => lat);
  const longitudes = points.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const spanLat = maxLat - minLat || 0.01;
  const spanLng = maxLng - minLng || 0.01;
  const svgPoints = points
    .map(([lat, lng]) => `${18 + ((lng - minLng) / spanLng) * 244},${74 - ((lat - minLat) / spanLat) * 54}`)
    .join(" ");

  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: "#e8f0ea" }}>
      <div className="px-3 pt-2 text-[10px] font-bold" style={{ color: "var(--color-forest)" }}>
        오늘의 동선 흐름
      </div>
      <svg viewBox="0 0 280 92" className="w-full h-[88px]" role="img" aria-label="일정 장소 간 이동 동선">
        <path d="M0 16 C55 5 76 37 128 24 S218 5 280 28" stroke="rgba(56,80,62,0.12)" strokeWidth="18" fill="none" />
        <polyline points={svgPoints} stroke="#2b6ce0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {([0, points.length - 1] as const).map((index) => {
          const [cx, cy] = svgPoints.split(" ")[index].split(",");
          return <circle key={index} cx={cx} cy={cy} r="5" fill={index === 0 ? "#d97316" : "#2b6ce0"} stroke="white" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}

function totals(route: ItineraryRoutesResponse) {
  const duration = route.segments.reduce((sum, segment) => sum + (segment.durationMinutes ?? 0), 0);
  const fare = route.segments.reduce((sum, segment) => sum + (segment.fare ?? 0), 0);
  return { duration, fare };
}

export default function ItineraryMobility({
  mode,
  route,
  loading,
  error,
  comparison,
  comparing,
  onModeChange,
  onCompare,
}: {
  mode: TransportMode;
  route: ItineraryRoutesResponse | null;
  loading: boolean;
  error: string | null;
  comparison: Partial<Record<TransportMode, ItineraryRoutesResponse>> | null;
  comparing: boolean;
  onModeChange: (mode: TransportMode) => void;
  onCompare: () => void;
}) {
  const regionTransit = route?.regionTransit;
  return (
    <section className="mx-5 mt-4 rounded-[20px] p-3.5" style={{ background: "white", boxShadow: "0 6px 18px -10px rgba(28,26,22,0.18)" }}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[12.5px] font-extrabold" style={{ color: "var(--color-ink)" }}>오늘의 이동</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--color-ink-faint)" }}>날짜별 실제 경로를 조회했어요</p>
        </div>
        <div className="flex rounded-xl p-0.5" style={{ background: "var(--color-ivory-warm)" }}>
          {(["CAR", "TRANSIT"] as const).map((candidate) => (
            <button
              key={candidate}
              onClick={() => onModeChange(candidate)}
              className="px-2.5 py-1.5 rounded-[10px] text-[10px] font-extrabold tap"
              style={candidate === mode ? { background: "white", color: "var(--color-accent)", boxShadow: "0 1px 4px rgba(28,26,22,0.1)" } : { color: "var(--color-ink-muted)" }}
            >
              {candidate === "CAR" ? "🚗 자차" : "🚌 대중교통"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-4 text-[11px] font-semibold" style={{ color: "var(--color-ink-muted)" }}>이동 경로를 불러오는 중…</p>}
      {error && <p className="mt-4 text-[11px] font-semibold" style={{ color: "#c2410c" }}>{error}</p>}

      {route && !loading && (
        <>
          <RouteSketch segments={route.segments} />
          <div className="mt-3 space-y-2">
            {route.segments.map((segment) => (
              <div key={`${segment.fromItemId}-${segment.toItemId}`} className="rounded-xl px-3 py-2.5" style={{ background: "var(--color-ivory)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-[10.5px] font-bold leading-snug" style={{ color: "var(--color-ink)" }}>
                    {segment.fromTitle} <span style={{ color: "var(--color-ink-faint)" }}>→</span> {segment.toTitle}
                  </p>
                  {segment.landingUrl && <a href={segment.landingUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] font-extrabold" style={{ color: "var(--color-accent)" }}>길찾기 ↗</a>}
                </div>
                <p className="mt-1 text-[10px] leading-snug" style={{ color: "var(--color-ink-soft)" }}>
                  {STATUS_COPY[segment.status]}
                  {segment.durationMinutes !== null && ` · ${segment.durationMinutes}분`}
                  {segment.distanceMeters !== null && ` · ${(segment.distanceMeters / 1000).toFixed(segment.distanceMeters < 1000 ? 1 : 1)}km`}
                  {segment.transfers !== null && segment.transfers > 0 && ` · 환승 ${segment.transfers}회`}
                  {formatMoney(segment.fare) && ` · ${formatMoney(segment.fare)}`}
                  {segment.taxiFare !== null && ` · 택시 약 ${segment.taxiFare.toLocaleString()}원`}
                </p>
                {segment.summary && <p className="mt-1 text-[9.5px] leading-snug" style={{ color: "var(--color-ink-faint)" }}>{segment.summary}</p>}
              </div>
            ))}
          </div>

          {regionTransit?.freeBus && (
            <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: "var(--color-mint-soft)", color: "#08795a" }}>
              <p className="text-[10.5px] font-extrabold">🚌 {regionTransit.freeBus.label}</p>
              <p className="mt-0.5 text-[9.5px] leading-snug">{regionTransit.freeBus.caution}</p>
              <p className="mt-1 text-[9px] opacity-75">{regionTransit.freeBus.basis}</p>
            </div>
          )}
          {regionTransit?.timetable && (
            <a href={regionTransit.timetable.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between rounded-xl px-3 py-2.5 text-[10.5px] font-bold tap" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-dark)" }}>
              <span>지역 버스 시간표 보기</span><span>↗</span>
            </a>
          )}
          <p className="mt-3 text-[9px] leading-snug" style={{ color: "var(--color-ink-faint)" }}>{route.notice} · {route.source}</p>
        </>
      )}

      <button onClick={onCompare} disabled={comparing} className="mt-3 text-[10px] font-extrabold underline underline-offset-2 tap" style={{ color: "var(--color-accent)" }}>
        {comparing ? "수단 비교 중…" : "자차 · 대중교통 비교하기"}
      </button>
      {comparison?.CAR && comparison.TRANSIT && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["CAR", "TRANSIT"] as const).map((candidate) => {
            const total = totals(comparison[candidate]!);
            return <div key={candidate} className="rounded-xl px-2.5 py-2" style={{ background: "var(--color-ivory-warm)" }}>
              <p className="text-[10px] font-extrabold" style={{ color: "var(--color-ink)" }}>{candidate === "CAR" ? "🚗 자차" : "🚌 대중교통"}</p>
              <p className="mt-1 text-[10px]" style={{ color: "var(--color-ink-soft)" }}>총 {total.duration}분</p>
              <p className="text-[10px]" style={{ color: "var(--color-ink-soft)" }}>{candidate === "TRANSIT" ? `${total.fare.toLocaleString()}원` : "구간별 택시비 제공"}</p>
            </div>;
          })}
        </div>
      )}
    </section>
  );
}
