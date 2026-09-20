import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import RegionArt from "../components/RegionArt";
import Button from "../components/Button";
import { REGION_MAP } from "../data/regions";
import { TAG_MAP } from "../data/tags";
import { getRegionGallery, toPreferenceTags, type RegionGalleryResponse } from "../lib/recommendationApi";
import { toSecureUrl } from "../lib/imageUrl";
import { useApp } from "../store/AppContext";

export default function RegionDetailPage() {
  const { regionId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const region = regionId ? REGION_MAP[regionId] : undefined;

  // 대표 사진은 한국관광공사에서 받아온다. 실패해도 화면은 그대로 보여준다.
  const [photos, setPhotos] = useState<RegionGalleryResponse["photos"]>([]);
  // 링크가 죽은 사진은 빼버린다. 한 장도 안 남으면 섹션 자체를 감춘다.
  const [brokenIds, setBrokenIds] = useState<number[]>([]);
  const backendId = region?.backendId;
  const visiblePhotos = photos.filter((photo) => !brokenIds.includes(photo.contentId));

  useEffect(() => {
    if (!backendId) return;
    let cancelled = false;
    getRegionGallery(backendId)
      .then((res) => {
        if (!cancelled) {
          setPhotos(res.photos.map((photo) => ({ ...photo, imageUrl: toSecureUrl(photo.imageUrl) ?? photo.imageUrl })));
        }
      })
      .catch(() => {/* 사진을 못 불러와도 지역 설명은 읽을 수 있어야 한다 */});
    return () => { cancelled = true; };
  }, [backendId]);

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

          {/* 지역 사진 — 글로만 된 소개보다 사진 몇 장이 지역을 더 잘 설명한다 */}
          {visiblePhotos.length > 0 && (
            <div>
              <p className="text-[13.5px] font-bold mb-3" style={{ color: "var(--color-ink)" }}>
                {region.shortName}의 장면들
              </p>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-thin -mx-5 px-5 pb-1">
                {visiblePhotos.map((photo, index) => (
                  <div
                    key={photo.contentId}
                    className="relative shrink-0 rounded-[18px] overflow-hidden"
                    style={{
                      // 첫 장을 크게 둬 잡지 펼침면처럼 리듬을 준다
                      width: index === 0 ? 232 : 150,
                      height: 188,
                      boxShadow: "0 2px 6px rgba(28,26,22,0.06), 0 12px 26px -12px rgba(28,26,22,0.24)",
                    }}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      onError={() => setBrokenIds((prev) => [...prev, photo.contentId])}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)" }}
                    />
                    <p className="absolute left-3 right-3 bottom-2.5 text-white text-[11.5px] font-bold leading-snug line-clamp-2">
                      {photo.title}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[9.5px] mt-2" style={{ color: "var(--color-ink-faint)" }}>
                사진 ⓒ한국관광공사
              </p>
            </div>
          )}

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
            // 날짜·박수·동행은 사용자가 직접 골라야 한다(백엔드 필수값이고, 생성 후에는 바꿀 수 없다).
            // 지역만 고정한 채 일정 조건 입력 화면으로 보낸다.
            const query = new URLSearchParams({
              regionId: region.id,
              backendRegionId: String(region.backendId ?? 0),
              tags: toPreferenceTags(region.tags).join(","),
            });
            navigate(`/plan?${query.toString()}`);
          }}
        >
          이 지역으로 일정 만들기
        </Button>
      </div>
    </>
  );
}
