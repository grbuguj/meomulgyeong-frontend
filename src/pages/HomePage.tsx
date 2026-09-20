import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import Icon, { type IconName } from "../components/Icon";
import RegionArt from "../components/RegionArt";
import { REGIONS } from "../data/regions";
import { useApp } from "../store/AppContext";

interface HubCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
}

function HubCard({ icon, title, subtitle, onClick, primary }: HubCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[22px] p-4 flex items-center gap-3.5 tap text-left"
      style={
        primary
          ? {
              background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
              boxShadow: "0 10px 28px -10px rgba(43,108,224,0.5)",
            }
          : {
              background: "white",
              boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)",
            }
      }
    >
      <div
        className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[19px] shrink-0"
        style={{
          background: primary ? "rgba(255,255,255,0.2)" : "var(--color-ivory-warm)",
        }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-extrabold"
          style={{ color: primary ? "white" : "var(--color-ink)" }}
        >
          {title}
        </p>
        <p
          className="text-[11.5px] font-medium mt-0.5 truncate"
          style={{ color: primary ? "rgba(255,255,255,0.78)" : "var(--color-ink-faint)" }}
        >
          {subtitle}
        </p>
      </div>
      <span
        className="text-[15px] shrink-0"
        style={{ color: primary ? "white" : "var(--color-ink-faint)" }}
      >
        <Icon name="chevron-right" size={18} />
      </span>
    </button>
  );
}

export default function HomePage() {
  const { user, savedItineraries } = useApp();
  const navigate = useNavigate();

  // 완료한 여행에 이미 기여도 수치가 실려 오므로, 추가 조회 없이 합산한다.
  const totals = user.trips.reduce(
    (acc, trip) => ({
      populationDays: acc.populationDays + (trip.contribution?.populationContributionDays ?? 0),
      spending: acc.spending + (trip.contribution?.estimatedSpending ?? 0),
      stayHours: acc.stayHours + (trip.contribution?.stayHours ?? 0),
    }),
    { populationDays: 0, spending: 0, stayHours: 0 }
  );

  const stampPct = Math.round((user.stamps.length / REGIONS.length) * 100);
  const unvisited = REGIONS.filter((r) => !user.stamps.includes(r.id));
  // 다 돌았다면 다시 가볼 곳으로 전체를 보여준다
  const carousel = (unvisited.length > 0 ? unvisited : REGIONS).slice(0, 8);
  const hasTrips = user.trips.length > 0;

  return (
    <>
      <TopBar title="머물;경" />
      <div className="flex-1 overflow-y-auto pt-2 pb-4">
        <h2
          className="px-5 text-[24px] font-extrabold mt-3 mb-4 leading-tight tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          {user.nickname}님, 다시
          <br />
          어디로 떠나볼까요?
        </h2>

        {/* 누적 기여 — 완료할수록 쌓이는 값이라 홈에 두어야 계속 쌓고 싶어진다 */}
        {hasTrips ? (
          <div
            className="mx-5 rounded-[24px] p-5"
            style={{
              background: "linear-gradient(140deg, #3b82f6 0%, var(--color-accent-dark) 100%)",
              boxShadow: "0 12px 30px -12px rgba(43,108,224,0.55)",
            }}
          >
            <p className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>
              {user.nickname}님이 경북에서
            </p>
            <p className="text-[15px] font-bold text-white mt-1.5">머문 날</p>
            <p className="text-[46px] font-extrabold text-white leading-none mt-0.5">
              {totals.populationDays.toLocaleString("ko-KR")}
              <span className="text-[20px] ml-1.5">일</span>
            </p>
            <div
              className="grid grid-cols-3 gap-2 mt-4 pt-3.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.22)" }}
            >
              {[
                ["다녀온 여행", `${user.trips.length}번`],
                ["다녀온 지역", `${user.stamps.length}곳`],
                ["쓴 금액", `${(totals.spending / 10000).toFixed(0)}만원`],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {label}
                  </p>
                  <p className="text-[14px] font-extrabold text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-[9.5px] leading-snug mt-3" style={{ color: "rgba(255,255,255,0.62)" }}>
              머문 날은 그 지역의 생활인구로 집계돼요 · 행정안전부 기준
            </p>
          </div>
        ) : (
          <div
            className="mx-5 rounded-[24px] p-5"
            style={{ background: "var(--color-accent-soft)" }}
          >
            <p className="text-[14px] font-extrabold" style={{ color: "var(--color-accent-dark)" }}>
              아직 머문 날이 없어요
            </p>
            <p className="text-[12px] leading-relaxed mt-1.5" style={{ color: "var(--color-ink-soft)" }}>
              첫 여행을 다녀오면 머문 날이 여기에 쌓여요. 하루 3시간만 머물러도 그 지역에 기록됩니다.
            </p>
          </div>
        )}

        {/* 스탬프 진행 */}
        <button
          onClick={() => navigate("/explore")}
          className="mx-5 mt-2.5 rounded-[20px] p-4 flex items-center gap-3.5 tap text-left"
          style={{
            width: "calc(100% - 40px)",
            background: "white",
            boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)",
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[13px] font-extrabold" style={{ color: "var(--color-ink)" }}>
                경상북도 인구감소지역
              </p>
              <p className="text-[12px] font-extrabold" style={{ color: "var(--color-accent)" }}>
                {user.stamps.length} / {REGIONS.length}
              </p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(43,108,224,0.12)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${stampPct}%`,
                  background: "linear-gradient(90deg, #3b82f6, var(--color-accent-dark))",
                }}
              />
            </div>
          </div>
          <Icon name="chevron-right" size={18} />
        </button>

        {/* 아직 안 가본 지역 — 사진으로 보여줘야 가고 싶어진다 */}
        <p
          className="px-5 mt-7 mb-3 text-[14px] font-extrabold"
          style={{ color: "var(--color-ink)" }}
        >
          {unvisited.length > 0 ? "아직 가보지 않은 곳" : "다시 가볼 만한 곳"}
        </p>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-thin px-5 pb-2">
          {carousel.map((region) => (
            <button
              key={region.id}
              onClick={() => navigate(`/region/${region.id}`)}
              className="shrink-0 w-[132px] rounded-[18px] overflow-hidden text-left tap"
              style={{
                background: "white",
                boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.1)",
              }}
            >
              <RegionArt region={region} className="h-[88px]" label={false} />
              <div className="p-2.5">
                <p className="text-[12.5px] font-extrabold" style={{ color: "var(--color-ink)" }}>
                  {region.name}
                </p>
                <p
                  className="text-[10.5px] mt-0.5 leading-snug line-clamp-2"
                  style={{ color: "var(--color-ink-muted)" }}
                >
                  {region.summary}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-5 mt-7 space-y-2.5">
          <HubCard
            icon="sparkles"
            title="새 일정 추가하기"
            subtitle="취향 선택부터 시작해요"
            primary
            onClick={() => navigate("/plan")}
          />
          <HubCard
            icon="bookmark"
            title="저장한 일정 보기"
            subtitle={
              savedItineraries.length > 0
                ? `${savedItineraries.length}개의 일정을 저장했어요`
                : "저장한 일정이 없어요"
            }
            onClick={() => navigate("/my/saved")}
          />
          <HubCard
            icon="map"
            title="지난 여행 보기"
            subtitle={
              user.trips.length > 0
                ? `${user.trips.length}번의 여행을 완료했어요`
                : "완료한 여행이 없어요"
            }
            onClick={() => navigate("/my/trips")}
          />
        </div>
      </div>
      <BottomNav />
    </>
  );
}
