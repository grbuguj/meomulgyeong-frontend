export default function TagChip({
  label,
  emoji,
  active,
  disabled,
  onClick,
}: {
  label: string;
  emoji?: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-2xl text-sm font-semibold tap whitespace-nowrap transition-all ${
        disabled && !active ? "opacity-30 cursor-not-allowed" : ""
      }`}
      style={
        active
          ? {
              background: "linear-gradient(135deg, #3b82f6 0%, var(--color-accent-dark) 100%)",
              color: "white",
              boxShadow: "0 6px 18px -6px rgba(43,108,224,0.52)",
            }
          : {
              background: "white",
              color: "var(--color-ink-soft)",
              border: "1.5px solid var(--color-line)",
              boxShadow: "0 1px 2px rgba(28,26,22,0.03), 0 4px 10px -6px rgba(28,26,22,0.07)",
            }
      }
    >
      {emoji && <span className="mr-1.5">{emoji}</span>}
      {label}
    </button>
  );
}
