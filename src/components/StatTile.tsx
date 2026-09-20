export default function StatTile({
  label,
  value,
  unit,
  note,
  accent,
  tone = "accent",
}: {
  label: string;
  value: string | number;
  unit?: string;
  /** 숫자만으로는 크기를 가늠하기 어려워, 비교 기준을 한 줄로 덧붙인다. */
  note?: string;
  accent?: boolean;
  tone?: "accent" | "mint" | "amber" | "forest";
}) {
  const tones: Record<string, { bg: string; text: string; gradSolid: string }> = {
    accent: {
      bg: "var(--color-accent-soft)",
      text: "var(--color-accent-dark)",
      gradSolid: "linear-gradient(135deg, #3b82f6 0%, var(--color-accent-dark) 100%)",
    },
    mint: {
      bg: "var(--color-mint-soft)",
      text: "#0a8a65",
      gradSolid: "linear-gradient(135deg, #12b886 0%, var(--color-mint) 100%)",
    },
    amber: {
      bg: "var(--color-amber-soft)",
      text: "#b96210",
      gradSolid: "linear-gradient(135deg, #f59e0b 0%, var(--color-amber) 100%)",
    },
    forest: {
      bg: "var(--color-forest-light)",
      text: "var(--color-forest-dark)",
      gradSolid: "linear-gradient(135deg, var(--color-forest-mid) 0%, var(--color-forest-dark) 100%)",
    },
  };
  const t = tones[tone];

  return (
    <div
      className="rounded-3xl p-3.5"
      style={{
        background: accent ? t.gradSolid : t.bg,
        color: accent ? "#fff" : "var(--color-ink)",
        boxShadow: accent
          ? "0 8px 20px -8px rgba(0,0,0,0.25)"
          : "0 1px 2px rgba(28,26,22,0.04), 0 6px 16px -8px rgba(28,26,22,0.08)",
      }}
    >
      <p
        className="text-[11.5px] font-semibold"
        style={{ color: accent ? "rgba(255,255,255,0.8)" : t.text }}
      >
        {label}
      </p>
      <p className="text-[23px] font-extrabold mt-1 tracking-tight leading-none">
        {value}
        {unit && <span className="text-[11.5px] font-semibold ml-1 opacity-80">{unit}</span>}
      </p>
      {note && (
        <p
          className="text-[9.5px] font-semibold mt-1.5 leading-snug"
          style={{ color: accent ? "rgba(255,255,255,0.75)" : t.text, opacity: accent ? 1 : 0.75 }}
        >
          {note}
        </p>
      )}
    </div>
  );
}
