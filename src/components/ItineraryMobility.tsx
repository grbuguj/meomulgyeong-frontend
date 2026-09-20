import type { ItineraryRoutesResponse, RouteSegment, TransportMode } from "../lib/itineraryApi";
import type { PlaceItem } from "../types";
import RouteMap from "./RouteMap";

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

function totals(route: ItineraryRoutesResponse) {
  const duration = route.segments.reduce((sum, segment) => sum + (segment.durationMinutes ?? 0), 0);
  const fare = route.segments.reduce((sum, segment) => sum + (segment.fare ?? 0), 0);
  return { duration, fare };
}

/**
 * 일정 화면의 이동 정보.
 * 화면의 주인공은 장소 목록이라, 동선 지도는 그 위에("map") 구간별 상세는 그 아래("detail")에
 * 나뉘어 놓인다. 두 자리 모두 같은 조회 결과를 쓰므로 한 컴포넌트에서 파트만 갈라 그린다.
 */
export default function ItineraryMobility({
  part,
  mode,
  items,
  route,
  loading,
  error,
  comparison,
  comparing,
  onModeChange,
  onCompare,
}: {
  part: "map" | "detail";
  mode: TransportMode;
  /** part="map"에서만 쓰는 그날의 일정 항목 — 지도 마커 좌표와 번호를 여기서 얻는다. */
  items?: PlaceItem[];
  route: ItineraryRoutesResponse | null;
  loading: boolean;
  error: string | null;
  comparison: Partial<Record<TransportMode, ItineraryRoutesResponse>> | null;
  comparing: boolean;
  onModeChange: (mode: TransportMode) => void;
  onCompare: () => void;
}) {
  const regionTransit = route?.regionTransit;

  if (part === "map") {
    return (
      <section className="mx-5 mt-4 rounded-[20px] p-3.5" style={{ background: "white", boxShadow: "0 6px 18px -10px rgba(28,26,22,0.18)" }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[15px] font-extrabold" style={{ color: "var(--color-ink)" }}>오늘의 동선</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--color-ink-faint)" }}>날짜별 실제 경로를 조회했어요</p>
          </div>
          <div className="flex rounded-xl p-0.5" style={{ background: "var(--color-ivory-warm)" }}>
            {(["CAR", "TRANSIT"] as const).map((candidate) => (
              <button
                key={candidate}
                onClick={() => onModeChange(candidate)}
                className="px-3 py-2 rounded-[10px] text-[11.5px] font-extrabold tap"
                style={candidate === mode ? { background: "white", color: "var(--color-accent)", boxShadow: "0 1px 4px rgba(28,26,22,0.1)" } : { color: "var(--color-ink-muted)" }}
              >
                {candidate === "CAR" ? "🚗 자차" : "🚌 대중교통"}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="mt-4 text-[11px] font-semibold" style={{ color: "var(--color-ink-muted)" }}>이동 경로를 불러오는 중…</p>}
        {error && <p className="mt-4 text-[11px] font-semibold" style={{ color: "#c2410c" }}>{error}</p>}
        {route && !loading && <RouteMap segments={route.segments} items={items ?? []} />}
      </section>
    );
  }

  // 구간별 상세 — 장소 목록을 다 본 뒤에 확인하는 보조 정보
  if (!route || loading) return null;

  return (
    <section className="mx-5 mt-4 rounded-[20px] p-3.5" style={{ background: "white", boxShadow: "0 6px 18px -10px rgba(28,26,22,0.18)" }}>
      <p className="text-[15px] font-extrabold" style={{ color: "var(--color-ink)" }}>구간별 이동 정보</p>
      {route && !loading && (
        <>
          <div className="mt-3 space-y-2">
            {route.segments.map((segment) => (
              <div key={`${segment.fromItemId}-${segment.toItemId}`} className="rounded-2xl px-3.5 py-3" style={{ background: "var(--color-ivory)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-[13px] font-bold leading-snug" style={{ color: "var(--color-ink)" }}>
                    {segment.fromTitle} <span style={{ color: "var(--color-ink-faint)" }}>→</span> {segment.toTitle}
                  </p>
                  {segment.landingUrl && <a href={segment.landingUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[11.5px] font-extrabold" style={{ color: "var(--color-accent)" }}>길찾기 ↗</a>}
                </div>
                <p className="mt-1.5 text-[11.5px] leading-snug" style={{ color: "var(--color-ink-soft)" }}>
                  {STATUS_COPY[segment.status]}
                  {segment.durationMinutes !== null && ` · ${segment.durationMinutes}분`}
                  {segment.distanceMeters !== null && ` · ${(segment.distanceMeters / 1000).toFixed(segment.distanceMeters < 1000 ? 1 : 1)}km`}
                  {segment.transfers !== null && segment.transfers > 0 && ` · 환승 ${segment.transfers}회`}
                  {formatMoney(segment.fare) && ` · ${formatMoney(segment.fare)}`}
                  {segment.taxiFare !== null && ` · 택시 약 ${segment.taxiFare.toLocaleString()}원`}
                </p>
                {segment.summary && <p className="mt-1 text-[10.5px] leading-snug" style={{ color: "var(--color-ink-faint)" }}>{segment.summary}</p>}
              </div>
            ))}
          </div>

          {regionTransit?.freeBus && (
            <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: "var(--color-mint-soft)", color: "#08795a" }}>
              <p className="text-[12.5px] font-extrabold">🚌 {regionTransit.freeBus.label}</p>
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

      <button onClick={onCompare} disabled={comparing} className="mt-4 text-[12px] font-extrabold underline underline-offset-2 tap" style={{ color: "var(--color-accent)" }}>
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
