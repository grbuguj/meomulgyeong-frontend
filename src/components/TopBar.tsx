import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { LogoMark } from "./Logo";

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
            style={{ color: "var(--color-ink)" }}
          >
            <Icon name="arrow-left" size={18} />
          </button>
        )}
      </div>

      {isBrand ? (
        <span className="flex items-center gap-1.5">
          <LogoMark size={26} />
          <span
            className="font-serif-kr text-[20px] font-bold tracking-tight"
            style={{ color: "#1E4E8C" }}
          >
            머물<span style={{ color: "#FF8F5A" }}>;</span>경
          </span>
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
