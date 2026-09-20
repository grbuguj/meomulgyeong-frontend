import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Button from "../components/Button";
import StatTile from "../components/StatTile";
import { LogoMark } from "../components/Logo";
import { REGION_MAP } from "../data/regions";
import { calcContribution, MINIMUM_STAY_HOURS_PER_DAY } from "../lib/contribution";
import type { Itinerary, TripCompletion } from "../types";
import { useApp } from "../store/AppContext";

/**
 * 0에서 목표값까지 세어 올린다.
 * 결과를 한 번에 띄우면 그냥 표가 되어버려서, 숫자가 쌓이는 과정을 보여준다.
 * 모션을 줄이도록 설정한 사용자에게는 곧바로 최종값을 보여준다.
 */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target <= 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // ease-out: 빠르게 올라갔다 부드럽게 멈춘다
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, durationMs]);

  return value;
}

export default function TripResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { trip: TripCompletion; itinerary: Itinerary } | undefined;

  // 완료 직후 navigate state로만 들어오는 화면이라, 새로고침 등으로 값이 없으면 홈으로 돌린다.
  useEffect(() => {
    if (!state) navigate("/home", { replace: true });
  }, [state, navigate]);

  if (!state) return null;
  return <TripResult trip={state.trip} itinerary={state.itinerary} />;
}

function TripResult({ trip, itinerary }: { trip: TripCompletion; itinerary: Itinerary }) {
  const navigate = useNavigate();
  const { user } = useApp();
  const region = REGION_MAP[trip.regionId];
  // 서버가 계산한 값이 있으면 그대로 쓰고, 없을 때만 프론트 추정치로 채운다.
  const estimated = calcContribution(
    { ...itinerary, days: itinerary.days.slice(0, trip.visitedDays) },
    trip.visitors
  );
  const server = trip.contribution;
  const isServerCalculated = server != null;
  const stayHours = server?.stayHours ?? estimated.stayHours;
  const spend = server?.estimatedSpending ?? server?.reportedSpending ?? estimated.estimatedSpend;
  const populationDays = server?.populationContributionDays ?? estimated.livingPopulationDays;

  // 체류시간이 산입 기준(하루 3시간)의 몇 배인지 — 숫자에 크기를 가늠할 기준을 붙인다
  const stayBaseline = trip.visitedDays * MINIMUM_STAY_HOURS_PER_DAY;
  const stayBaselineMultiple = stayBaseline > 0 ? Math.round(stayHours / stayBaseline) : 0;

  const [shareLabel, setShareLabel] = useState("공유하기");

  const handleShare = async () => {
    const text = `${region.name} 생활인구에 ${populationDays}일을 더했어요. ${trip.visitedDays}일 머물고 ${(spend / 10000).toFixed(1)}만원을 썼습니다. — 머물;경`;
    try {
      // 모바일에서는 시스템 공유 시트, 데스크톱 등 미지원 환경에서는 클립보드로 떨어뜨린다.
      if (navigator.share) {
        await navigator.share({ title: "머물;경 — 이번 여행이 남긴 자국", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareLabel("복사했어요");
      setTimeout(() => setShareLabel("공유하기"), 2000);
    } catch {
      // 사용자가 공유 시트를 닫은 경우가 대부분이라 조용히 넘어간다
    }
  };

  const animatedPopulationDays = useCountUp(populationDays);
  const animatedStayHours = useCountUp(stayHours, 1100);
  const animatedSpend = useCountUp(spend / 10000, 1100);

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

        {/* 이 서비스가 말하려는 핵심 지표. 나머지 수치는 이걸 받치는 근거라 아래로 내린다. */}
        <div
          className="rounded-[26px] p-5 mb-3"
          style={{
            background: "linear-gradient(140deg, #3b82f6 0%, var(--color-accent-dark) 100%)",
            boxShadow: "0 12px 32px -12px rgba(43,108,224,0.6)",
          }}
        >
          <p className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.78)" }}>
            생활인구 산입
          </p>
          <p className="text-[24px] font-extrabold leading-tight mt-1.5 text-white">
            {region.name} 생활인구에
            <br />
            <span className="text-[34px]">{Math.round(animatedPopulationDays)}일</span>이 더해졌어요
          </p>
          <div
            className="mt-4 pt-4 text-[11.5px] leading-relaxed"
            style={{ borderTop: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.88)" }}
          >
            행정안전부는 하루 {MINIMUM_STAY_HOURS_PER_DAY}시간 이상 머문 사람을 그 지역의 생활인구로 셉니다.
            인구감소지역의 체류인구는 등록인구의 <strong className="text-white">약 4.6배</strong> —
            잠깐 머문 사람들이 그 지역을 떠받치고 있다는 뜻이에요.
          </div>
        </div>

        {/* 근거가 되는 수치 */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <StatTile
            label="체류시간"
            value={Math.round(animatedStayHours)}
            unit="시간"
            tone="mint"
            note={stayBaselineMultiple ? `산입 기준의 ${stayBaselineMultiple}배` : undefined}
          />
          <StatTile
            label={isServerCalculated ? "지역 소비" : "예상 소비"}
            value={animatedSpend.toFixed(1)}
            unit="만원"
            tone="amber"
            note={spend > 0 ? `${region.shortName}에서` : "입력 안 함"}
          />
          <StatTile
            label="방문 지역"
            value={user.stamps.length}
            unit="/ 15곳"
            tone="forest"
            note="인구감소지역"
          />
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
          {isServerCalculated
            ? "체류시간·소비·생활인구 산입 일수는 서버가 실제 여행 기록을 기준으로 산출한 값입니다."
            : "예상 소비 금액은 한국관광공사 「국민여행조사」 1인 1일 평균 지출액을 기준으로 산출한 추정값입니다."}{" "}
          생활인구 산입 일수는 행정안전부 「인구감소지역 지원 특별법」 시행령상 체류 기준을 적용했습니다.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-6">
          <Button variant="secondary" onClick={handleShare}>
            {shareLabel}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            카드 저장
          </Button>
        </div>

        <Button
          variant="accent"
          fullWidth
          className="mt-2.5"
          onClick={() => navigate("/my", { state: { scrollTo: "completed" } })}
        >
          마이페이지에서 확인하기
        </Button>
      </div>

      {/* 인쇄·저장용 자국 카드 — 화면에는 보이지 않고 인쇄할 때만 출력된다 */}
      <div className="print-sheet">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <LogoMark size={40} />
          <span style={{ fontSize: 17, fontWeight: 800, color: "#1E4E8C" }}>머물;경</span>
        </div>

        <p style={{ fontSize: 12, marginBottom: 4 }}>
          {user.nickname ? `${user.nickname}님이 ` : ""}
          {region.name}에 남긴 자국
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 18 }}>
          {region.name} 생활인구에
          <br />
          {populationDays}일이 더해졌습니다
        </h1>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 18 }}>
          <tbody>
            {[
              ["체류시간", `${stayHours}시간`],
              ["지역 소비", `${(spend / 10000).toFixed(1)}만원`],
              ["방문 지역", `${user.stamps.length} / 15곳`],
              ["여행 기간", `${trip.visitedDays}일 · ${trip.visitors}명`],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ padding: "6px 0", borderBottom: "1px solid #ddd", width: "45%" }}>{label}</td>
                <td style={{ padding: "6px 0", borderBottom: "1px solid #ddd", fontWeight: 700 }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: 9, lineHeight: 1.7, color: "#555" }}>
          행정안전부는 하루 {MINIMUM_STAY_HOURS_PER_DAY}시간 이상 머문 사람을 그 지역의 생활인구로 셉니다.
          인구감소지역의 체류인구는 등록인구의 약 4.6배입니다. (행정안전부, 2025.6)
          <br />
          생활인구 산입 일수는 「인구감소지역 지원 특별법」 시행령상 체류 기준을 적용했습니다.
          {!isServerCalculated && " 소비 금액은 한국관광공사 「국민여행조사」 1인 1일 평균 지출액 기준 추정값입니다."}
        </p>
      </div>
    </>
  );
}
