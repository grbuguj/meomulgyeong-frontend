import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import Button from "../components/Button";
import StatTile from "../components/StatTile";
import { LogoMark } from "../components/Logo";
import Stamp from "../components/Stamp";
import RegionArt from "../components/RegionArt";
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
  const stayHours = server?.stayHours ?? estimated.stayHours;
  const reportedSpend = server?.reportedSpending;
  const spend = reportedSpend ?? server?.estimatedSpending ?? estimated.estimatedSpend;
  const spendLabel = reportedSpend !== undefined ? "입력 소비" : "추정 지역 소비";
  const populationDays = server?.populationContributionDays ?? estimated.livingPopulationDays;

  // 체류시간이 산입 기준(하루 3시간)의 몇 배인지 — 숫자에 크기를 가늠할 기준을 붙인다
  const stayBaseline = trip.visitedDays * MINIMUM_STAY_HOURS_PER_DAY;
  const stayBaselineMultiple = stayBaseline > 0 ? Math.round(stayHours / stayBaseline) : 0;

  // 이 지역을 몇 번째로 다녀왔는지 — 도장에 횟수를 새긴다
  const visitCount = user.trips.filter((t) => t.regionId === trip.regionId).length || 1;

  const [shareLabel, setShareLabel] = useState("공유하기");

  const handleShare = async () => {
    const text = `${region.name}에 ${populationDays}일 머문 지역 기여 기록을 남겼어요. ${trip.visitedDays}일 머물고 ${(spend / 10000).toFixed(1)}만원을 기록했습니다. — 머물;경`;
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
      <TopBar
        title="이번 여행이 남긴 자국"
        // 히스토리로 돌아가면 방금 완료한 일정 화면으로 되돌아가 완료 입력이 다시 뜬다.
        // 이미 끝난 여행이므로 기록이 쌓인 마이페이지로 보낸다.
        onBack={() => navigate("/my", { state: { scrollTo: "completed" }, replace: true })}
      />
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-10">
        {/* 도장이 찍히는 순간 — 여행을 마쳤다는 걸 숫자보다 먼저 보여준다.
            어디를 다녀왔는지 글자보다 사진이 빠르게 읽히므로 뒤에 지역 사진을 깐다. */}
        <div className="relative rounded-[26px] overflow-hidden mb-6">
          {/* 사진은 배경으로 깔고, 높이는 안쪽 내용이 정한다 */}
          <div className="absolute inset-0">
            <RegionArt region={region} className="h-full" label={false} />
          </div>
          <div
            className="absolute inset-0"
            // 아래쪽 문구만 읽히면 되므로, 사진이 가려지지 않을 만큼만 어둡게 깐다
            style={{
              background:
                "linear-gradient(to top, rgba(12,20,34,0.78) 0%, rgba(12,20,34,0.28) 46%, rgba(12,20,34,0.04) 100%)",
            }}
          />
          <div className="relative flex flex-col items-center pt-7 pb-6">
            <div
              className="rounded-full"
              style={{ background: "rgba(255,255,255,0.94)", padding: 6 }}
            >
              <Stamp
                seed={region.id}
                label={region.shortName}
                collected
                size={100}
                pressing
                visitCount={visitCount}
              />
            </div>
            <p
              className="text-[13px] font-extrabold mt-4 text-white animate-in"
              style={{ animationDelay: "0.6s" }}
            >
              {visitCount > 1
                ? `${region.shortName} ${visitCount}번째 도장`
                : `${region.shortName} 첫 도장을 찍었어요`}
            </p>
          </div>
        </div>

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
            {region.name} 지역 기여 기록
          </p>
          <p className="text-[24px] font-extrabold leading-tight mt-1.5 text-white">
            <span className="text-[40px]">{Math.round(animatedPopulationDays)}일</span>
            <br />
            {region.shortName}에서 머문 기록이에요
          </p>
          <div
            className="mt-4 pt-4 text-[11.5px] leading-relaxed"
            style={{ borderTop: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.88)" }}
          >
            하루 {MINIMUM_STAY_HOURS_PER_DAY}시간 이상 체류 기준을 참고해 여행 기록을 계산했어요.
            이 수치는 서비스 안에서 보여주는 지역 기여 지표이며, 실제 공공 통계에 반영되는 값은 아닙니다.
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
            label={spendLabel}
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
          <div className="grid grid-cols-5 gap-y-3 justify-items-center">
            {Object.values(REGION_MAP).map((r) => (
              <Stamp
                key={r.id}
                seed={r.id}
                label={r.shortName}
                collected={user.stamps.includes(r.id)}
                size={48}
              />
            ))}
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
          체류일수와 소비 금액은 사용자가 확인한 여행 기록을 바탕으로 표시합니다. 지역 기여 일수는
          생활인구 산정 기준을 참고해 계산한 서비스 내 지표이며, 실제 공공 통계에 반영되는 값은 아닙니다.
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
          {region.name}에 남긴
          <br />
          {populationDays}일의 지역 기여 기록
        </h1>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 18 }}>
          <tbody>
            {[
              ["체류시간", `${stayHours}시간`],
              [spendLabel, `${(spend / 10000).toFixed(1)}만원`],
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
          지역 기여 일수는 하루 {MINIMUM_STAY_HOURS_PER_DAY}시간 이상 체류 기준을 참고해 계산한 서비스 내 지표입니다.
          실제 공공 통계에 반영되는 값은 아닙니다.
        </p>
      </div>
    </>
  );
}
