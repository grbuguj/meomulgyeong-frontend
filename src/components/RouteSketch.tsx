import type { RouteSegment } from "../lib/itineraryApi";

/**
 * 카카오 지도를 쓸 수 없을 때(키 미설정·SDK 로드 실패) 쓰는 대체 표현.
 * 지도 타일 없이 경로 좌표만 상자 안에 그린다.
 */
const SKETCH_WIDTH = 280;
const SKETCH_HEIGHT = 150;
const SKETCH_PADDING = 16;

/**
 * 경로 좌표를 그대로 그린 동선 스케치.
 * 가로·세로를 각각 늘려 상자를 꽉 채우면 실제 이동 모양이 뭉개지므로,
 * 양축에 같은 배율을 적용하고 남는 공간은 가운데로 몬다.
 */
export default function RouteSketch({ segments }: { segments: RouteSegment[] }) {
  const points = segments.flatMap((segment) => segment.path ?? []);
  if (points.length < 2) return null;

  const latitudes = points.map(([lat]) => lat);
  const longitudes = points.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const minLng = Math.min(...longitudes);
  const spanLat = Math.max(...latitudes) - minLat || 0.0001;
  const spanLng = Math.max(...longitudes) - minLng || 0.0001;

  // 경도 1도는 위도 1도보다 짧다(위도가 높을수록 더 짧다). 가로를 그만큼 줄여야 실제 모양이 된다.
  const midLat = (minLat + Math.max(...latitudes)) / 2;
  const lngScale = Math.cos((midLat * Math.PI) / 180);
  const spanX = spanLng * lngScale;

  const innerWidth = SKETCH_WIDTH - SKETCH_PADDING * 2;
  const innerHeight = SKETCH_HEIGHT - SKETCH_PADDING * 2;
  const scale = Math.min(innerWidth / spanX, innerHeight / spanLat);
  const drawnWidth = spanX * scale;
  const drawnHeight = spanLat * scale;
  const offsetX = (SKETCH_WIDTH - drawnWidth) / 2;
  const offsetY = (SKETCH_HEIGHT - drawnHeight) / 2;

  const svgPoints = points
    .map(([lat, lng]) => {
      const x = offsetX + (lng - minLng) * lngScale * scale;
      // 위도는 위로 갈수록 커지므로 화면 좌표에서는 뒤집는다
      const y = offsetY + drawnHeight - (lat - minLat) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: "#e8f0ea" }}>
      <div className="px-3 pt-2 text-[10px] font-bold" style={{ color: "var(--color-forest)" }}>
        오늘의 동선 흐름
      </div>
      <svg
        viewBox={`0 0 ${SKETCH_WIDTH} ${SKETCH_HEIGHT}`}
        className="w-full"
        style={{ aspectRatio: `${SKETCH_WIDTH} / ${SKETCH_HEIGHT}` }}
        role="img"
        aria-label="일정 장소 간 이동 동선"
      >
        <polyline points={svgPoints} stroke="#2b6ce0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {([0, points.length - 1] as const).map((index) => {
          const [cx, cy] = svgPoints.split(" ")[index].split(",");
          return <circle key={index} cx={cx} cy={cy} r="5" fill={index === 0 ? "#d97316" : "#2b6ce0"} stroke="white" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
}
