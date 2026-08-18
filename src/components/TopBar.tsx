import { useNavigate } from "react-router-dom";

export default function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: boolean;
  right?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const isBrand = title === "머물;경";

  return (
    <div
      className="flex items-center justify-between px-4 py-3 glass-ivory sticky top-0 z-10"
      style={{
        borderBottom: "1px solid rgba(228,222,200,0.45)",
      }}
    >
      <div className="w-9">
        {onBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white card-soft flex items-center justify-center tap"
            aria-label="뒤로가기"
            style={{ color: "var(--color-ink)", fontSize: 18, fontWeight: 600 }}
          >
            ‹
          </button>
        )}
      </div>

      {isBrand ? (
        <span
          className="font-serif-kr text-[20px] font-bold tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          머물;경
        </span>
      ) : (
        <h1
          className="text-[15.5px] font-bold tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          {title}
        </h1>
      )}

      <div className="w-9 flex justify-end">{right}</div>
    </div>
  );
}
