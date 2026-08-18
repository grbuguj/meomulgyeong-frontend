import { useNavigate } from "react-router-dom";
import type { Region } from "../types";
import RegionArt from "./RegionArt";
import { TAG_MAP } from "../data/tags";

export default function RegionCard({
  region,
  reason,
  onClick,
}: {
  region: Region;
  reason?: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={onClick ?? (() => navigate(`/region/${region.id}`))}
      className="w-full text-left rounded-[26px] overflow-hidden card-soft-lg tap"
      style={{ background: "white" }}
    >
      {/* Art with overlay */}
      <div className="relative">
        <RegionArt region={region} className="h-44" label={false} />

        {/* Gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
          }}
        />

        {/* Text on art */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3.5">
          {reason && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                color: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              ✓ {reason}
            </span>
          )}
          <p className="text-white font-bold text-[17px] tracking-tight leading-snug">{region.name}</p>
          <p
            className="text-[12px] leading-snug mt-0.5 line-clamp-1"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            {region.identityLine}
          </p>
        </div>

        {/* Hub badge */}
        {region.isVerifiedHub && (
          <span
            className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(212,135,42,0.9)",
              color: "white",
              boxShadow: "0 2px 8px -2px rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            대표 거점
          </span>
        )}
      </div>

      {/* Tags row */}
      <div className="px-4 py-3 flex gap-1.5 flex-wrap">
        {region.tags.map((t) => (
          <span
            key={t}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "var(--color-ivory-warm)",
              color: "var(--color-ink-soft)",
            }}
          >
            {TAG_MAP[t]?.emoji} {TAG_MAP[t]?.label}
          </span>
        ))}
      </div>
    </button>
  );
}
