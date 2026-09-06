import { useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import RegionArt from "../components/RegionArt";
import Button from "../components/Button";
import { REGION_MAP } from "../data/regions";
import { TAG_MAP } from "../data/tags";
import { useApp } from "../store/AppContext";

export default function RegionDetailPage() {
  const { regionId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const region = regionId ? REGION_MAP[regionId] : undefined;

  if (!region) return <div className="p-6" style={{ color: "var(--color-ink-soft)" }}>지역을 찾을 수 없어요.</div>;

  return (
    <>
      <TopBar title={region.name} onBack />
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Hero art */}
        <div className="relative">
          <RegionArt region={region} className="h-56" label={false} />
          {/* Gradient overlay */}
          <div
            className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)",
            }}
          />
          {/* Overlaid region name */}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-5">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {user.stamps.includes(region.id) && (
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(12,158,116,0.88)", color: "white" }}
                >
                  ✓ 방문 완료
                </span>
              )}
              {region.isVerifiedHub && (
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(212,135,42,0.88)", color: "white" }}
                >
                  대표 검증 거점
                </span>
              )}
            </div>
            <h2
              className="text-white text-[22px] font-extrabold leading-tight tracking-tight"
            >
              {region.identityLine}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-5">
          {/* Description */}
          <p
            className="text-[13.5px] leading-relaxed"
            style={{ color: "var(--color-ink-soft)" }}
          >
            {region.description}
          </p>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {region.tags.map((t) => (
              <span
                key={t}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: "var(--color-ivory-warm)",
                  color: "var(--color-ink-soft)",
                }}
              >
                {TAG_MAP[t]?.emoji} {TAG_MAP[t]?.label}
              </span>
            ))}
          </div>

          {/* 대표 관광 포인트 */}
          <div>
            <p
              className="text-[13.5px] font-bold mb-3"
              style={{ color: "var(--color-ink)" }}
            >
              대표 관광 포인트
            </p>
            <div className="flex flex-wrap gap-2">
              {region.representativeSpots.map((s) => (
                <span
                  key={s}
                  className="text-[12.5px] font-semibold px-3.5 py-2 rounded-2xl"
                  style={{
                    background: "white",
                    color: "var(--color-ink)",
                    boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 14px -6px rgba(28,26,22,0.08)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* 여행 성격 */}
          <div
            className="rounded-[22px] p-4"
            style={{ background: "var(--color-ivory-warm)" }}
          >
            <p
              className="text-[12px] font-bold mb-1.5 tracking-wide uppercase"
              style={{ color: "var(--color-ink-muted)" }}
            >
              여행 성격
            </p>
            <p
              className="text-[13.5px] font-semibold"
              style={{ color: "var(--color-ink-soft)" }}
            >
              {region.travelStyle}
            </p>
          </div>

          {/* 현지인 꿀정보 */}
          <div
            className="rounded-[22px] p-4"
            style={{
              background: "linear-gradient(135deg, var(--color-accent-soft) 0%, white 100%)",
              border: "1px solid rgba(43,108,224,0.1)",
            }}
          >
            <p
              className="text-[12px] font-bold mb-2 tracking-wide"
              style={{ color: "var(--color-accent-dark)" }}
            >
              🗝️ 현지인 꿀정보
            </p>
            <p
              className="text-[13.5px] leading-relaxed"
              style={{ color: "var(--color-ink-soft)" }}
            >
              {region.localTip}
            </p>
          </div>
        </div>
      </div>

      <div
        className="sticky bottom-0 px-4 py-4"
        style={{
          background: "linear-gradient(to top, var(--color-ivory) 75%, transparent)",
        }}
      >
        <Button
          variant="accent"
          fullWidth
          onClick={() => {
            const base = `/itinerary/${region.id}?nights=2&companion=SOLO`;
            navigate(region.backendId ? `${base}&backendRegionId=${region.backendId}` : base);
          }}
        >
          이 지역으로 일정 만들기
        </Button>
      </div>
    </>
  );
}
