import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import RegionArt from "../components/RegionArt";
import Stamp from "../components/Stamp";
import { REGION_MAP } from "../data/regions";
import { useApp } from "../store/AppContext";

/** "2026. 10. 1. ~ 10. 4." 처럼 짧게 — 카드 위에 겹쳐 올리므로 길면 잘린다. */
function formatRange(start: string, end?: string): string {
  const from = new Date(start);
  const head = `${from.getFullYear()}. ${from.getMonth() + 1}. ${from.getDate()}.`;
  if (!end) return head;
  const to = new Date(end);
  return `${head} ~ ${to.getMonth() + 1}. ${to.getDate()}.`;
}

export default function CompletedTripsPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  // 최근에 다녀온 여행이 위로 온다. 서버가 주는 순서에 기대지 않고 직접 정렬한다.
  const trips = [...user.trips].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const totals = trips.reduce(
    (acc, trip) => ({
      days: acc.days + (trip.contribution?.populationContributionDays ?? 0),
      spending: acc.spending + (trip.contribution?.estimatedSpending ?? 0),
    }),
    { days: 0, spending: 0 }
  );

  return (
    <>
      <TopBar title="완료한 여행" onBack />
      <div className="flex-1 overflow-y-auto pb-8">
        {trips.length === 0 ? (
          <div className="px-5 mt-4">
            <div
              className="rounded-2xl p-6 mt-10 text-center"
              style={{ background: "white", boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 16px -8px rgba(28,26,22,0.08)" }}
            >
              <p className="text-2xl mb-2">🗺️</p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
                아직 완료한 여행이 없어요.
                <br />
                일정을 다녀온 뒤 “여행 완료”를 누르면 이곳에 기록이 쌓여요.
              </p>
              <button
                onClick={() => navigate("/home")}
                className="mt-4 text-[12.5px] font-bold tap"
                style={{ color: "var(--color-accent)" }}
              >
                새 일정 만들러 가기 →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 기록 전체를 한 줄로 요약 */}
            <div
              className="mx-5 mt-4 rounded-[20px] px-4 py-3.5 flex items-center justify-between"
              style={{ background: "var(--color-accent-soft)" }}
            >
              <p className="text-[12px] font-bold" style={{ color: "var(--color-accent-dark)" }}>
                {trips.length}번의 여행
              </p>
              <p className="text-[12px] font-bold" style={{ color: "var(--color-accent-dark)" }}>
                머문 날 {totals.days}일 · {(totals.spending / 10000).toFixed(0)}만원
              </p>
            </div>

            <div className="px-5 mt-3 space-y-3">
              {trips.map((trip, index) => {
                const region = REGION_MAP[trip.regionId];
                const days = trip.contribution?.populationContributionDays ?? trip.visitedDays;
                const spending = trip.contribution?.estimatedSpending ?? 0;
                return (
                  <button
                    key={`${trip.itineraryId}-${trip.completedAt}-${index}`}
                    onClick={() => {
                      if (!region) return;
                      // 그때 그 일정을 그대로 다시 연다(itineraryId가 있으면 서버가 저장본을 준다).
                      // 완료 기록이라는 사실과 기여도 수치는 state로 함께 넘겨 리포트로 보여준다.
                      const query = new URLSearchParams({
                        itineraryId: trip.itineraryId,
                        nights: String(trip.nights ?? Math.max(trip.visitedDays - 1, 1)),
                        companion: "SOLO",
                        backendRegionId: String(region.backendId ?? 0),
                      });
                      navigate(`/itinerary/${region.id}?${query.toString()}`, {
                        state: { completedTrip: trip },
                      });
                    }}
                    className="w-full rounded-[22px] overflow-hidden text-left tap"
                    style={{
                      background: "white",
                      boxShadow: "0 2px 6px rgba(28,26,22,0.05), 0 12px 26px -12px rgba(28,26,22,0.2)",
                    }}
                  >
                    <div className="relative">
                      {region && <RegionArt region={region} className="h-[126px]" label={false} />}
                      <div
                        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.68), transparent)" }}
                      />
                      <div className="absolute left-4 right-16 bottom-3">
                        <p className="text-white text-[17px] font-extrabold tracking-tight leading-tight">
                          {trip.title ?? region?.name ?? "여행 지역"}
                        </p>
                        {trip.startDate && (
                          <p className="text-[10.5px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                            {formatRange(trip.startDate, trip.endDate)}
                          </p>
                        )}
                      </div>
                      {/* 다녀왔다는 표시를 도장으로 — 마이페이지 스탬프와 같은 모양 */}
                      {region && (
                        // 사진 위에 바로 찍으면 잉크색이 묻히므로 종이처럼 흰 바탕을 깐다
                        <div
                          className="absolute right-3 bottom-3 rounded-full"
                          style={{ background: "rgba(255,255,255,0.94)", padding: 4 }}
                        >
                          <Stamp seed={region.id} label={region.shortName} collected size={44} />
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[9.5px] font-semibold" style={{ color: "var(--color-ink-faint)" }}>
                            머문 날
                          </p>
                          <p className="text-[14px] font-extrabold" style={{ color: "var(--color-ink)" }}>
                            {days}일
                          </p>
                        </div>
                        <div>
                          <p className="text-[9.5px] font-semibold" style={{ color: "var(--color-ink-faint)" }}>
                            함께한 사람
                          </p>
                          <p className="text-[14px] font-extrabold" style={{ color: "var(--color-ink)" }}>
                            {trip.visitors}명
                          </p>
                        </div>
                        {spending > 0 && (
                          <div>
                            <p className="text-[9.5px] font-semibold" style={{ color: "var(--color-ink-faint)" }}>
                              쓴 금액
                            </p>
                            <p className="text-[14px] font-extrabold" style={{ color: "var(--color-ink)" }}>
                              {(spending / 10000).toFixed(0)}만원
                            </p>
                          </div>
                        )}
                      </div>
                      <span className="text-[10.5px] font-semibold" style={{ color: "var(--color-ink-faint)" }}>
                        {new Date(trip.completedAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
