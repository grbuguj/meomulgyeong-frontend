import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/home", label: "홈", icon: "🏠" },
  { to: "/explore", label: "둘러보기", icon: "🧭" },
  { to: "/my", label: "마이", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-20 px-3 pb-4 pt-1"
      style={{
        background: "linear-gradient(to top, var(--color-ivory) 58%, transparent 100%)",
      }}
    >
      <div
        className="glass rounded-3xl border flex justify-around px-1.5 py-2"
        style={{
          borderColor: "rgba(228,222,200,0.4)",
          boxShadow: "0 8px 28px -6px rgba(28,26,22,0.16), 0 2px 6px rgba(28,26,22,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-7 py-2 rounded-2xl text-[10.5px] font-bold tap transition-colors duration-150 ${
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-ink-muted)]"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: "var(--color-accent-soft)" }
                : {}
            }
          >
            <span className="text-[18px] leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
