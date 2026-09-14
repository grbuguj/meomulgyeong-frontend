import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { REGION_MAP } from "../data/regions";
import { useApp } from "../store/AppContext";

export default function CompletedTripsPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const trips = [...user.trips].reverse();

  return (
    <>
      <TopBar title="완료한 여행" onBack />
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-5 mt-4">
          {trips.length === 0 ? (
            <div className="rounded-2xl p-6 mt-10 text-center" style={{ background: "white", boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 16px -8px rgba(28,26,22,0.08)" }}>
              <p className="text-2xl mb-2">🗺️</p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
                아직 완료한 여행이 없어요.<br />일정을 다녀온 뒤 “여행 완료”를 누르면 이곳에 기록이 쌓여요.
              </p>
              <button onClick={() => navigate("/home")} className="mt-4 text-[12.5px] font-bold tap" style={{ color: "var(--color-accent)" }}>
                새 일정 만들러 가기 →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map((trip, index) => {
                const region = REGION_MAP[trip.regionId];
                return (
                  <div key={`${trip.itineraryId}-${trip.completedAt}-${index}`} className="rounded-2xl p-3.5 flex justify-between items-center" style={{ background: "white", boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 14px -6px rgba(28,26,22,0.08)" }}>
                    <div>
                      <p className="text-[13.5px] font-bold" style={{ color: "var(--color-ink)" }}>{region?.name ?? "여행 지역"}</p>
                      <p className="text-[11.5px] font-medium mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
                        {trip.visitedDays}일 체류 · {trip.visitors}명
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--color-ink-faint)" }}>
                      {new Date(trip.completedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
