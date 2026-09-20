/**
 * 지역 방문 스탬프.
 * 여권 도장처럼 보이도록 이중 테두리 원형에 살짝 기울여 찍는다.
 * 기울기는 지역 id에서 뽑아 고정한다 — 렌더할 때마다 흔들리면 도장이 아니라 애니메이션처럼 보인다.
 */
function tiltOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  return (hash % 13) - 6; // -6° ~ +6°
}

export default function Stamp({
  label,
  collected,
  size = 62,
  visitCount,
  pressing = false,
  seed,
}: {
  label: string;
  collected: boolean;
  size?: number;
  /** 2회 이상 방문했으면 도장 아래에 횟수를 적는다. */
  visitCount?: number;
  /** 방금 찍힌 도장. 내리꽂히는 연출을 준다. */
  pressing?: boolean;
  seed?: string;
}) {
  const tilt = tiltOf(seed ?? label);
  const ink = "#1E4E8C";

  if (!collected) {
    return (
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          border: "1.5px dashed var(--color-line)",
          color: "var(--color-ink-faint)",
          background: "var(--color-ivory-warm)",
        }}
      >
        <span className="text-[10.5px] font-bold">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {pressing && (
        <span
          className="absolute rounded-full animate-stamp-shock"
          style={{ width: size, height: size, border: `3px solid ${ink}` }}
        />
      )}
      <div
        className={`rounded-full flex flex-col items-center justify-center ${pressing ? "animate-stamp-press" : ""}`}
        style={{
          width: size,
          height: size,
          transform: pressing ? undefined : `rotate(${tilt}deg)`,
          border: `2.5px solid ${ink}`,
          // 안쪽 얇은 테두리로 도장 특유의 이중 링을 만든다
          boxShadow: `inset 0 0 0 2px #fff, inset 0 0 0 3.5px ${ink}`,
          color: ink,
          background: "rgba(30,78,140,0.07)",
        }}
      >
        <span className="text-[11px] font-extrabold leading-none tracking-tight">{label}</span>
        {visitCount !== undefined && visitCount > 1 && (
          <span className="text-[7.5px] font-bold mt-0.5 opacity-70">{visitCount}회</span>
        )}
      </div>
    </div>
  );
}
