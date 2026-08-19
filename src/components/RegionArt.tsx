import type { Region } from "../types";

type ArtStyle = "mountain" | "hanok" | "sea" | "night" | "rolling" | "volcanic";

function getStyle(region: Region): ArtStyle {
  if (region.id === "ulleung") return "volcanic";
  if (region.id === "yeongyang") return "night";
  if (region.tags.includes("sea")) return "sea";
  if (region.tags.includes("hanok")) return "hanok";
  if (region.tags.includes("bike")) return "rolling";
  return "mountain";
}

interface P {
  c1: string;
  c2: string;
  uid: string;
}

function MountainArt({ c1, c2, uid }: P) {
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`mg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} stopOpacity="0.42" />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <radialGradient id={`ms-${uid}`} cx="72%" cy="20%" r="32%">
          <stop offset="0%" stopColor="white" stopOpacity="0.24" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`mh-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#mg-${uid})`} />
      <path
        d="M-5 82 L20 58 L46 70 L70 44 L96 62 L120 42 L146 58 L170 44 L205 54 L205 120 L-5 120 Z"
        fill={c2}
        fillOpacity="0.28"
      />
      <path
        d="M-5 94 L16 76 L40 86 L66 66 L90 78 L116 60 L140 72 L166 58 L192 66 L205 63 L205 120 L-5 120 Z"
        fill={c2}
        fillOpacity="0.52"
      />
      <path
        d="M-5 120 L-5 104 L18 88 L44 98 L68 80 L92 92 L116 76 L142 88 L166 74 L190 82 L205 78 L205 120 Z"
        fill={c1}
      />
      <ellipse cx="144" cy="22" rx="34" ry="22" fill={`url(#ms-${uid})`} />
      <circle cx="144" cy="22" r="6" fill="white" fillOpacity="0.18" />
      <rect width="200" height="120" fill={`url(#mh-${uid})`} />
    </svg>
  );
}

function HanokArt({ c1, c2, uid }: P) {
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`hg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8ecd6" />
          <stop offset="38%" stopColor={c2} stopOpacity="0.48" />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <radialGradient id={`hm-${uid}`} cx="22%" cy="18%" r="25%">
          <stop offset="0%" stopColor="#fff5d4" stopOpacity="0.88" />
          <stop offset="55%" stopColor="#fff5d4" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fff5d4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#hg-${uid})`} />
      <circle cx="40" cy="24" r="10" fill="#fff6d8" fillOpacity="0.85" />
      <ellipse cx="40" cy="24" rx="30" ry="20" fill={`url(#hm-${uid})`} />
      <path
        d="M-5 92 L26 70 L56 82 L86 60 L116 74 L146 56 L174 66 L205 60 L205 120 L-5 120 Z"
        fill={c1}
        fillOpacity="0.42"
      />
      <rect y="107" width="200" height="13" fill={c1} fillOpacity="0.72" />
      {/* 대청마루 건물 (중앙-우측) */}
      <path d="M96 70 L124 58 L152 70 L147 70 L124 60 L101 70 Z" fill={c1} fillOpacity="0.92" />
      <rect x="101" y="70" width="46" height="24" rx="1" fill={c1} fillOpacity="0.82" />
      <rect x="118" y="82" width="12" height="12" rx="1.5" fill={c1} />
      {/* 작은 건물 (좌측) */}
      <path d="M22 80 L44 70 L66 80 L62 80 L44 72 L26 80 Z" fill={c1} fillOpacity="0.76" />
      <rect x="26" y="80" width="36" height="18" rx="1" fill={c1} fillOpacity="0.66" />
      {/* 홍등 */}
      <circle cx="112" cy="62" r="2.2" fill="#ffaa44" fillOpacity="0.75" />
      <circle cx="138" cy="60" r="2.2" fill="#ffaa44" fillOpacity="0.75" />
    </svg>
  );
}

function SeaArt({ c1, c2, uid }: P) {
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4e6f4" />
          <stop offset="45%" stopColor={c2} stopOpacity="0.58" />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <linearGradient id={`sw-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} stopOpacity="0.88" />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <radialGradient id={`sr-${uid}`} cx="50%" cy="56%" r="44%">
          <stop offset="0%" stopColor="white" stopOpacity="0.28" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="62" fill={`url(#sg-${uid})`} />
      <rect y="62" width="200" height="58" fill={`url(#sw-${uid})`} />
      <rect y="59" width="200" height="6" fill="white" fillOpacity="0.12" />
      <ellipse cx="100" cy="66" rx="72" ry="9" fill={`url(#sr-${uid})`} />
      <path
        d="M-5 76 Q20 70 50 76 Q80 82 110 76 Q140 70 170 76 Q192 80 205 76 L205 84 Q192 90 170 84 Q140 78 110 84 Q80 90 50 84 Q20 78 -5 84 Z"
        fill="white"
        fillOpacity="0.1"
      />
      <path
        d="M-5 90 Q20 84 50 90 Q80 96 110 90 Q140 84 170 90 Q192 94 205 90 L205 98 L-5 98 Z"
        fill="white"
        fillOpacity="0.07"
      />
      <path
        d="M-5 104 Q20 98 50 104 Q80 110 110 104 Q140 98 170 104 Q192 108 205 104 L205 120 L-5 120 Z"
        fill="white"
        fillOpacity="0.09"
      />
      <circle cx="152" cy="22" r="10" fill="#fff4b4" fillOpacity="0.82" />
      <circle cx="152" cy="22" r="18" fill="#fff4b4" fillOpacity="0.14" />
    </svg>
  );
}

function NightArt({ uid }: { uid: string }) {
  const stars: [number, number, number, number][] = [
    [18, 12, 1.5, 1], [42, 7, 1.0, 0.85], [66, 18, 0.7, 0.55],
    [92, 6, 1.5, 0.95], [118, 15, 0.7, 0.6], [143, 4, 1.2, 0.8],
    [168, 12, 0.7, 0.5], [192, 20, 1.0, 0.7],
    [8, 32, 0.7, 0.45], [34, 26, 1.2, 0.8], [58, 38, 0.7, 0.55],
    [84, 28, 1.5, 1], [108, 34, 0.7, 0.5], [134, 22, 1.0, 0.75],
    [160, 30, 0.7, 0.55], [186, 38, 1.2, 0.8],
    [22, 48, 1.0, 0.7], [50, 44, 0.7, 0.5], [78, 52, 1.5, 0.9],
    [104, 46, 0.7, 0.55], [128, 50, 1.0, 0.7], [154, 42, 0.7, 0.5],
    [178, 52, 1.2, 0.78],
    [14, 60, 0.7, 0.42], [40, 57, 1.0, 0.65], [68, 64, 0.7, 0.48],
  ];
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`ng-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#07061a" />
          <stop offset="55%" stopColor="#131028" />
          <stop offset="100%" stopColor="#1e1a42" />
        </linearGradient>
        <radialGradient id={`nm-${uid}`} cx="76%" cy="18%" r="26%">
          <stop offset="0%" stopColor="#fff6cc" stopOpacity="0.88" />
          <stop offset="38%" stopColor="#fff6cc" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#fff6cc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`nw-${uid}`} cx="44%" cy="36%" r="58%">
          <stop offset="0%" stopColor="#8870c8" stopOpacity="0.065" />
          <stop offset="100%" stopColor="#8870c8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#ng-${uid})`} />
      <ellipse cx="100" cy="36" rx="135" ry="34" fill={`url(#nw-${uid})`} transform="rotate(-12 100 36)" />
      <circle cx="152" cy="20" r="22" fill={`url(#nm-${uid})`} />
      <circle cx="152" cy="20" r="8" fill="#fff6cc" fillOpacity="0.9" />
      {stars.map(([x, y, r, o], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="white" fillOpacity={o} />
      ))}
      <path
        d="M-5 120 L-5 90 L20 73 L46 85 L70 67 L96 80 L120 63 L146 75 L170 65 L193 70 L205 68 L205 120 Z"
        fill="#07061a"
      />
    </svg>
  );
}

function RollingArt({ c1, c2, uid }: P) {
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`rg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf5e0" />
          <stop offset="48%" stopColor={c2} stopOpacity="0.52" />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <radialGradient id={`rs-${uid}`} cx="62%" cy="18%" r="28%">
          <stop offset="0%" stopColor="#fff8a0" stopOpacity="0.88" />
          <stop offset="55%" stopColor="#fff8a0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fff8a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#rg-${uid})`} />
      <circle cx="124" cy="22" r="10" fill="#fff8a0" fillOpacity="0.9" />
      <ellipse cx="124" cy="22" rx="32" ry="22" fill={`url(#rs-${uid})`} />
      <path
        d="M-5 90 Q26 67 60 78 Q96 90 130 70 Q162 53 190 67 L205 65 L205 120 L-5 120 Z"
        fill={c2}
        fillOpacity="0.36"
      />
      <path
        d="M-5 102 Q22 80 56 90 Q86 100 118 83 Q148 68 176 81 L205 78 L205 120 L-5 120 Z"
        fill={c2}
        fillOpacity="0.6"
      />
      <path
        d="M-5 120 L-5 110 Q24 92 56 102 Q88 112 120 97 Q150 84 178 95 L205 93 L205 120 Z"
        fill={c1}
      />
      <path
        d="M76 120 Q86 108 92 96 Q97 86 104 78 Q110 72 118 67"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeOpacity="0.28"
        strokeDasharray="3 5"
      />
    </svg>
  );
}

function VolcanicArt({ c1, c2, uid }: P) {
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`vg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#183c5a" />
          <stop offset="55%" stopColor={c1} stopOpacity="0.68" />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`vo-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} stopOpacity="0.68" />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <radialGradient id={`vr-${uid}`} cx="50%" cy="64%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="72" fill={`url(#vg-${uid})`} />
      <rect y="72" width="200" height="48" fill={`url(#vo-${uid})`} />
      <ellipse cx="100" cy="76" rx="82" ry="10" fill={`url(#vr-${uid})`} />
      <path
        d="M-5 82 Q22 78 50 82 Q78 86 108 82 Q138 78 168 82 Q188 84 205 82 L205 90 L-5 90 Z"
        fill="white"
        fillOpacity="0.07"
      />
      <ellipse cx="100" cy="78" rx="84" ry="22" fill={c1} fillOpacity="0.62" />
      <path d="M56 120 L80 76 L100 50 L120 76 L144 120 Z" fill={c2} fillOpacity="0.72" />
      <path d="M61 120 L83 78 L100 53 L117 78 L139 120 Z" fill={c1} />
      <path d="M88 52 Q100 44 112 52 L109 61 L91 61 Z" fill="white" fillOpacity="0.55" />
      <rect y="110" width="200" height="10" fill={c2} fillOpacity="0.28" />
    </svg>
  );
}

export default function RegionArt({
  region,
  className = "",
  label = true,
}: {
  region: Region;
  className?: string;
  label?: boolean;
}) {
  const [c1, c2] = region.heroPalette;
  const style = getStyle(region);
  const uid = region.id;

  const svgArt = {
    mountain: <MountainArt c1={c1} c2={c2} uid={uid} />,
    hanok: <HanokArt c1={c1} c2={c2} uid={uid} />,
    sea: <SeaArt c1={c1} c2={c2} uid={uid} />,
    night: <NightArt uid={uid} />,
    rolling: <RollingArt c1={c1} c2={c2} uid={uid} />,
    volcanic: <VolcanicArt c1={c1} c2={c2} uid={uid} />,
  }[style];

  return (
    <div className={`relative overflow-hidden flex items-end ${className}`}>
      {region.heroImage ? (
        <img
          src={region.heroImage}
          alt={region.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // 이미지 로드 실패 시 SVG art로 폴백
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        svgArt
      )}
      {/* SVG art를 이미지 뒤 배경으로도 항상 깔아둠 (fallback) */}
      {region.heroImage && (
        <div className="absolute inset-0 -z-10">{svgArt}</div>
      )}
      {label && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
          <div className="relative z-10 p-3 text-white">
            <p className="text-[9px] font-bold opacity-70 tracking-[0.18em] uppercase">경상북도</p>
            <p className="text-[17px] font-bold leading-tight tracking-tight mt-0.5">{region.shortName}</p>
          </div>
        </>
      )}
    </div>
  );
}
