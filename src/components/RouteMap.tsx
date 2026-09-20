import { useEffect, useMemo, useRef, useState } from "react";
import type { RouteSegment } from "../lib/itineraryApi";
import type { PlaceItem } from "../types";
import { hasKakaoMapKey, loadKakaoMaps } from "../lib/kakaoMap";
import RouteSketch from "./RouteSketch";

/** 지도에 찍을 장소 — 타임라인의 번호(1,2,3…)를 그대로 쓴다. */
interface Stop {
  itemId: string;
  order: number;
  name: string;
  latitude: number;
  longitude: number;
}

/** 지도에 그릴 선. 실제 경로가 없는 구간은 점선 직선으로 잇는다. */
interface Line {
  key: string;
  path: [number, number][];
  dashed: boolean;
}

const LINE_COLOR = "#2b6ce0";

function markerHtml(stop: Stop, isFirst: boolean, isLast: boolean) {
  const background = isFirst ? "#d97316" : isLast ? "#22312a" : LINE_COLOR;
  return (
    `<div style="display:flex;align-items:center;justify-content:center;` +
    `width:22px;height:22px;border-radius:999px;background:${background};` +
    `color:#fff;font-size:11px;font-weight:800;line-height:1;` +
    `border:2px solid #fff;box-shadow:0 2px 6px rgba(28,26,22,0.32)">${stop.order}</div>`
  );
}

export default function RouteMap({ segments, items }: { segments: RouteSegment[]; items: PlaceItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  // 폴리라인·마커는 setMap(null)로만 지울 수 있어서 직접 들고 있다가 다시 그릴 때 정리한다.
  const drawnRef = useRef<{ setMap(map: kakao.maps.Map | null): void }[]>([]);
  const [status, setStatus] = useState<"idle" | "ready" | "failed">("idle");
  const [interactive, setInteractive] = useState(false);

  const stops = useMemo<Stop[]>(
    () =>
      items.flatMap((item, index) =>
        typeof item.latitude === "number" && typeof item.longitude === "number"
          ? [{ itemId: item.id, order: index + 1, name: item.name, latitude: item.latitude, longitude: item.longitude }]
          : []
      ),
    [items]
  );

  const lines = useMemo<Line[]>(() => {
    const coordsByItemId = new Map(stops.map((stop) => [stop.itemId, stop] as const));
    return segments.flatMap((segment): Line[] => {
      const key = `${segment.fromItemId}-${segment.toItemId}`;
      if (segment.path && segment.path.length >= 2) {
        return [{ key, path: segment.path, dashed: false }];
      }
      // 대중교통에서 NO_STOP·NO_ROUTE면 경로 좌표가 없다. 두 장소를 점선으로만 이어준다.
      const from = coordsByItemId.get(String(segment.fromItemId));
      const to = coordsByItemId.get(String(segment.toItemId));
      if (!from || !to) return [];
      return [
        {
          key,
          path: [
            [from.latitude, from.longitude],
            [to.latitude, to.longitude],
          ] as [number, number][],
          dashed: true,
        },
      ];
    });
  }, [segments, stops]);

  const hasAnything = stops.length > 0 || lines.length > 0;
  const canUseMap = hasKakaoMapKey() && status !== "failed";

  useEffect(() => {
    if (!hasAnything || !canUseMap) return;
    let cancelled = false;

    loadKakaoMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        if (!mapRef.current) {
          const [firstLat, firstLng] = stops.length
            ? [stops[0].latitude, stops[0].longitude]
            : lines[0].path[0];
          mapRef.current = new maps.Map(containerRef.current, {
            center: new maps.LatLng(firstLat, firstLng),
            level: 6,
            // 카드 안에 박힌 지도가 모바일 세로 스크롤을 가로채지 않도록 기본은 잠가둔다.
            draggable: false,
            zoomable: false,
          });
        }
        const map = mapRef.current;

        drawnRef.current.forEach((drawn) => drawn.setMap(null));
        drawnRef.current = [];

        const bounds = new maps.LatLngBounds();

        lines.forEach((line) => {
          const path = line.path.map(([lat, lng]) => new maps.LatLng(lat, lng));
          path.forEach((point) => bounds.extend(point));
          const polyline = new maps.Polyline({
            path,
            strokeWeight: line.dashed ? 3 : 4,
            strokeColor: LINE_COLOR,
            strokeOpacity: line.dashed ? 0.5 : 0.85,
            strokeStyle: line.dashed ? "shortdash" : "solid",
          });
          polyline.setMap(map);
          drawnRef.current.push(polyline);
        });

        stops.forEach((stop, index) => {
          const position = new maps.LatLng(stop.latitude, stop.longitude);
          bounds.extend(position);
          const overlay = new maps.CustomOverlay({
            position,
            content: markerHtml(stop, index === 0, index === stops.length - 1),
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 10,
          });
          overlay.setMap(map);
          drawnRef.current.push(overlay);
        });

        if (!bounds.isEmpty()) map.setBounds(bounds, 28, 24, 28, 24);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [stops, lines, hasAnything, canUseMap]);

  useEffect(
    () => () => {
      drawnRef.current.forEach((drawn) => drawn.setMap(null));
      drawnRef.current = [];
      mapRef.current = null;
    },
    []
  );

  if (!hasAnything) return null;
  // 키가 없거나 SDK가 끝내 안 뜨면 기존 실루엣 표현으로 떨어진다.
  if (!canUseMap) return <RouteSketch segments={segments} />;

  const toggleInteractive = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !interactive;
    map.setDraggable(next);
    map.setZoomable(next);
    setInteractive(next);
  };

  return (
    <div className="mt-3 relative rounded-2xl overflow-hidden" style={{ background: "var(--color-forest-light)" }}>
      <div ref={containerRef} className="w-full h-[180px]" role="img" aria-label="오늘 일정 장소와 이동 경로 지도" />

      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center text-[10.5px] font-semibold" style={{ color: "var(--color-forest)" }}>
          지도를 불러오는 중…
        </div>
      )}

      {/* 카드 헤더가 이미 "오늘의 동선"이라 지도 위에는 조작 버튼만 얹는다 */}
      {status === "ready" && (
        <button
          onClick={toggleInteractive}
          className="absolute top-2 right-2 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold tap"
          style={{ background: "rgba(255,255,255,0.92)", color: "var(--color-accent)", boxShadow: "0 1px 4px rgba(28,26,22,0.14)" }}
        >
          {interactive ? "지도 고정" : "지도 움직이기"}
        </button>
      )}
    </div>
  );
}
