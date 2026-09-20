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
    // 높이를 고정한다. 안에 들어가는 것(로고·버튼·제목만)에 따라 페이지마다
    // 상단바 높이가 달라 보이던 문제가 있었다.
    <div
      className="relative flex items-center justify-between px-4 glass-ivory sticky top-0 z-10 shrink-0"
      style={{
        height: 56,
        borderBottom: "1px solid rgba(228,222,200,0.45)",
      }}
    >
      <div className="relative z-10 min-w-9 shrink-0">
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

      {/* 제목은 절대 중앙에 둔다. 좌우 버튼 폭이 달라도 가운데를 지키고,
          글자 버튼이 들어와도 제목 자리를 밀어내지 않는다. */}
      <div className="absolute inset-x-0 flex justify-center pointer-events-none px-16">
        {isBrand ? (
          <span className="flex items-center gap-1.5">
            <LogoMark size={22} />
            <span
              className="font-serif-kr text-[17px] font-bold tracking-tight leading-none"
              style={{ color: "#1E4E8C" }}
            >
              머물<span style={{ color: "#FF8F5A" }}>;</span>경
            </span>
          </span>
        ) : (
          <h1
            className="text-[15.5px] font-bold tracking-tight truncate"
            style={{ color: "var(--color-ink)" }}
          >
            {title}
          </h1>
        )}
      </div>

      <div className="relative z-10 min-w-9 shrink-0 flex justify-end whitespace-nowrap">{right}</div>
    </div>
  );
}
