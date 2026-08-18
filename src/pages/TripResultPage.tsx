import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Button from "../components/Button";
import StatTile from "../components/StatTile";
import { REGION_MAP } from "../data/regions";
import { calcContribution } from "../lib/contribution";
import type { Itinerary, TripCompletion } from "../types";
import { useApp } from "../store/AppContext";

export default function TripResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();
  const state = location.state as { trip: TripCompletion; itinerary: Itinerary } | undefined;

  if (!state) {
    navigate("/home");
    return null;
  }

  const { trip, itinerary } = state;
  const region = REGION_MAP[trip.regionId];
  const result = calcContribution(
    { ...itinerary, days: itinerary.days.slice(0, trip.visitedDays) },
    trip.visitors
  );

  return (
    <>
      <TopBar title="이번 여행이 남긴 자국" onBack />
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-10">
        {/* Header */}
        <div className="mb-6">
          <p
            className="text-[13px] font-bold mb-1"
            style={{ color: "var(--color-accent)" }}
          >
            {region.shortName} 여행 완료 🎉
          </p>
          <h2
            className="text-[25px] font-extrabold tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            당신이 남긴 자국
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatTile label="방문 지역" value={result.visitedRegions} unit={`/ 15곳`} tone="accent" accent />
          <StatTile label="누적 체류시간" value={result.stayHours} unit="시간" tone="mint" />
          <StatTile
            label="예상 지역 소비"
            value={(result.estimatedSpend / 10000).toFixed(1)}
            unit="만원"
            tone="amber"
          />
          <StatTile label="생활인구 산입" value={`+${result.livingPopulationDays}`} unit="일" tone="forest" />
        </div>

        {/* Badge grid */}
        <div
          className="rounded-[26px] p-5"
          style={{
            background: "white",
            boxShadow: "0 2px 8px rgba(28,26,22,0.04), 0 12px 32px -10px rgba(28,26,22,0.12)",
          }}
        >
          <p
            className="text-[14px] font-bold mb-3"
            style={{ color: "var(--color-ink)" }}
          >
            경상북도 15개 지역 수집 배지
          </p>
          <div className="grid grid-cols-5 gap-2">
            {Object.values(REGION_MAP).map((r) => {
              const done = user.stamps.includes(r.id);
              return (
                <div
                  key={r.id}
                  className="aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold"
                  title={r.shortName}
                  style={
                    done
                      ? {
                          background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                          color: "white",
                          boxShadow: "0 4px 10px -4px rgba(43,108,224,0.5)",
                        }
                      : {
                          background: "var(--color-ivory-warm)",
                          color: "var(--color-ink-faint)",
                        }
                  }
                >
                  {r.shortName}
                </div>
              );
            })}
          </div>
          <p
            className="text-[12px] font-semibold mt-3"
            style={{ color: "var(--color-ink-soft)" }}
          >
            수집 {user.stamps.length} / 15
          </p>
        </div>

        {/* Disclaimer */}
        <p
          className="text-[10.5px] mt-5 leading-relaxed"
          style={{ color: "var(--color-ink-faint)" }}
        >
          예상 소비 금액은 한국관광공사 「국민여행조사」 1인 1일 평균 지출액을 기준으로 산출한 추정값입니다.
          생활인구 산입 일수는 행정안전부 「인구감소지역 지원 특별법」 시행령상 체류 기준을 적용했습니다.
        </p>

        <Button variant="accent" fullWidth className="mt-6" onClick={() => navigate("/my")}>
          마이페이지에서 확인하기
        </Button>
      </div>
    </>
  );
}
