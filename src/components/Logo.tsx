import type { SVGProps } from "react";

/**
 * 머물;경 심볼 — 소백산 능선, 해, 그 아래로 흐르는 물길.
 * 브랜드 팔레트: Blue-700 #1E4E8C / Sunset-600 #FF8F5A
 *
 * mono를 켜면 단색(currentColor)으로 그려 어두운 배경이나 단색 인쇄에 쓸 수 있다.
 */
export function LogoMark({
  size = 40,
  mono = false,
  ...props
}: { size?: number; mono?: boolean } & SVGProps<SVGSVGElement>) {
  const id = mono ? "" : "mgm";
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 100 72" fill="none" aria-hidden="true" {...props}>
      {!mono && (
        <defs>
          <linearGradient id={`${id}-ridge`} x1="10" y1="10" x2="80" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2E6BA8" />
            <stop offset="1" stopColor="#1E4E8C" />
          </linearGradient>
          <linearGradient id={`${id}-stream`} x1="12" y1="46" x2="92" y2="66" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E4E8C" />
            <stop offset="1" stopColor="#3C7CB8" />
          </linearGradient>
        </defs>
      )}

      {/* 해 — 능선 사이로 떠오른다 */}
      <circle cx="66" cy="14" r="9" fill={mono ? "currentColor" : "#FF8F5A"} />

      {/* 능선 — 왼쪽 큰 봉우리와 오른쪽 낮은 봉우리가 겹친다 */}
      <path
        d="M4 47C13 36 20 25 28 18c6-5 11-4 16 1 5 5 10 13 15 19 4 5 9 8 15 8H4Z"
        fill={mono ? "currentColor" : `url(#${id}-ridge)`}
      />
      <path
        d="M46 46c7-8 12-14 17-17 4-2 8-1 12 3 5 5 12 11 19 14H46Z"
        fill={mono ? "currentColor" : "#3C7CB8"}
        opacity={mono ? 0.55 : 0.9}
      />

      {/* 물길 — 굽이쳐 흘러 나온다 */}
      <path
        d="M92 66c-14 0-26-1-36-3-9-2-14-5-14-9 0-5 6-8 17-9 5-1 8-2 8-4 0-3-5-4-14-4"
        stroke={mono ? "currentColor" : `url(#${id}-stream)`}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** 심볼 + 워드마크. 로그인·스플래시처럼 브랜드를 크게 보여주는 자리에 쓴다. */
export default function Logo({
  size = 48,
  mono = false,
  tagline = false,
}: {
  size?: number;
  mono?: boolean;
  tagline?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center" style={{ gap: size * 0.22 }}>
        <LogoMark size={size * 1.5} mono={mono} />
        <span
          className="font-serif-kr leading-none tracking-tight"
          style={{ fontSize: size, color: mono ? "currentColor" : "#1E4E8C" }}
        >
          머물
          <span style={{ color: mono ? "currentColor" : "#FF8F5A" }}>;</span>경
        </span>
      </div>
      {tagline && (
        <p
          className="font-semibold tracking-tight"
          style={{ fontSize: size * 0.26, marginTop: size * 0.3, color: mono ? "currentColor" : "#1E4E8C" }}
        >
          여행이 머무는 곳, 경북의 새로운 발견
        </p>
      )}
    </div>
  );
}
