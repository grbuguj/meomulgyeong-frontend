import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  fullWidth?: boolean;
}

const STYLES = {
  primary: {
    background: "linear-gradient(135deg, var(--color-forest) 0%, var(--color-forest-dark) 100%)",
    color: "white",
    boxShadow: "0 8px 24px -8px rgba(56,80,62,0.58)",
  },
  accent: {
    background: "linear-gradient(135deg, #3b82f6 0%, var(--color-accent-dark) 100%)",
    color: "white",
    boxShadow: "0 8px 24px -8px rgba(43,108,224,0.55)",
  },
  secondary: {
    background: "white",
    color: "var(--color-forest)",
    border: "1.5px solid var(--color-line)",
    boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 4px 12px -6px rgba(28,26,22,0.08)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-ink-soft)",
  },
};

export default function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  disabled,
  style,
  ...rest
}: Props) {
  const base = "rounded-[18px] px-5 py-3.5 text-[15px] font-bold transition-all tap disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed";
  const s = STYLES[variant];

  return (
    <button
      className={`${base} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      style={{ ...s, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
