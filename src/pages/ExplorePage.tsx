import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import RegionArt from "../components/RegionArt";
import { REGIONS } from "../data/regions";
import { TAGS } from "../data/tags";
import type { TagKey } from "../types";
import { useApp } from "../store/AppContext";

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [filter, setFilter] = useState<TagKey | "all">("all");

  const filtered = REGIONS.filter((r) => filter === "all" || r.tags.includes(filter));

  return (
    <>
      <TopBar title="둘러보기" />
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="px-5 pt-2">
          <h2
            className="text-[23px] font-extrabold tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            경상북도 15개 지역
          </h2>
          <p
            className="text-[13px] mt-1 font-medium"
            style={{ color: "var(--color-ink-soft)" }}
          >
            지금까지{" "}
            <span
              className="font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {user.stamps.length}곳
            </span>
            을 만났어요
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-5 mt-4 overflow-x-auto scrollbar-thin pb-1">
          <button
            onClick={() => setFilter("all")}
            className="px-4 py-2 rounded-2xl text-[12.5px] font-bold whitespace-nowrap tap"
            style={
              filter === "all"
                ? {
                    background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                    color: "white",
                    boxShadow: "0 6px 16px -6px rgba(43,108,224,0.5)",
                  }
                : {
                    background: "white",
                    color: "var(--color-ink-muted)",
                    boxShadow: "0 1px 2px rgba(28,26,22,0.03), 0 4px 10px -6px rgba(28,26,22,0.07)",
                  }
            }
          >
            전체
          </button>
          {TAGS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-2xl text-[12.5px] font-bold whitespace-nowrap tap"
              style={
                filter === t.key
                  ? {
                      background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
                      color: "white",
                      boxShadow: "0 6px 16px -6px rgba(43,108,224,0.5)",
                    }
                  : {
                      background: "white",
                      color: "var(--color-ink-muted)",
                      boxShadow: "0 1px 2px rgba(28,26,22,0.03), 0 4px 10px -6px rgba(28,26,22,0.07)",
                    }
              }
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 px-5 mt-5">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/region/${r.id}`)}
              className="text-left rounded-[22px] overflow-hidden tap"
              style={{
                background: "white",
                boxShadow: "0 1px 3px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.1)",
              }}
            >
              <div className="relative">
                <RegionArt region={r} className="h-24" label={false} />
                {user.stamps.includes(r.id) && (
                  <span
                    className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(12,158,116,0.9)",
                      color: "white",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    ✓ 방문
                  </span>
                )}
              </div>
              <div className="p-3">
                <p
                  className="text-[13.5px] font-bold leading-snug"
                  style={{ color: "var(--color-ink)" }}
                >
                  {r.name}
                </p>
                <p
                  className="text-[11px] mt-0.5 line-clamp-2 leading-snug"
                  style={{ color: "var(--color-ink-muted)" }}
                >
                  {r.summary}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}
