import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import RegionArt from "../components/RegionArt";
import { REGION_MAP } from "../data/regions";
import { useApp } from "../store/AppContext";
import { ApiError } from "../lib/apiClient";

export default function SavedItinerariesPage() {
  const { savedItineraries, removeSavedItinerary } = useApp();
  const navigate = useNavigate();
  const [removingItineraryId, setRemovingItineraryId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const list = [...savedItineraries].reverse();

  const handleRemove = async (itinId: string, backendItineraryId?: number) => {
    if (removingItineraryId) return;
    setRemovingItineraryId(itinId);
    setRemoveError(null);
    try {
      await removeSavedItinerary(itinId, backendItineraryId);
    } catch (error) {
      setRemoveError(error instanceof ApiError ? error.message : "저장 일정을 삭제하지 못했어요.");
    } finally {
      setRemovingItineraryId(null);
    }
  };

  return (
    <>
      <TopBar title="저장한 일정" onBack />
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-5 mt-4">
          {removeError && <p className="text-[12px] font-semibold mb-2" style={{ color: "#c2410c" }}>{removeError}</p>}
          {list.length === 0 ? (
            <div className="rounded-2xl p-6 mt-10 text-center" style={{ background: "white", boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 6px 16px -8px rgba(28,26,22,0.08)" }}>
              <p className="text-2xl mb-2">📑</p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
                아직 저장한 일정이 없어요.<br />지역 추천에서 일정을 책갈피 해보세요.
              </p>
              <button onClick={() => navigate("/home")} className="mt-4 text-[12.5px] font-bold tap" style={{ color: "var(--color-accent)" }}>
                새 일정 만들러 가기 →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {list.map((itin) => {
                const region = REGION_MAP[itin.regionId];
                return (
                  <div key={itin.id} className="rounded-[20px] overflow-hidden flex items-stretch" style={{ background: "white", boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)" }}>
                    {region ? <RegionArt region={region} className="w-20" label={false} /> : <div className="w-20 shrink-0" style={{ background: "var(--color-accent-soft)" }} />}
                    <div className="flex-1 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[13.5px] font-bold" style={{ color: "var(--color-ink)" }}>{region?.name ?? "여행 지역"}</p>
                        <p className="text-[11.5px] font-medium mt-0.5" style={{ color: "var(--color-ink-muted)" }}>{itin.nights}박 {itin.nights + 1}일</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => {
                          const base = `/itinerary/${itin.regionId}?nights=${itin.nights}&companion=${itin.companion}`;
                          navigate(itin.backendItineraryId ? `${base}&itineraryId=${itin.backendItineraryId}` : base);
                        }} className="text-[12px] font-bold tap" style={{ color: "var(--color-accent)" }}>보기</button>
                        <button onClick={() => handleRemove(itin.id, itin.backendItineraryId)} disabled={removingItineraryId === itin.id} className="text-[12px] font-bold tap" style={{ color: "var(--color-ink-faint)" }}>
                          {removingItineraryId === itin.id ? "삭제 중…" : "삭제"}
                        </button>
                      </div>
                    </div>
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
