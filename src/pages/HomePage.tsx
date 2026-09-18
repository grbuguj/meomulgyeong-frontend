import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import Icon, { type IconName } from "../components/Icon";
import { useApp } from "../store/AppContext";

interface HubCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
}

function HubCard({ icon, title, subtitle, onClick, primary }: HubCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[22px] p-4 flex items-center gap-3.5 tap text-left"
      style={
        primary
          ? {
              background: "linear-gradient(135deg, #3b82f6, var(--color-accent-dark))",
              boxShadow: "0 10px 28px -10px rgba(43,108,224,0.5)",
            }
          : {
              background: "white",
              boxShadow: "0 1px 2px rgba(28,26,22,0.04), 0 8px 20px -8px rgba(28,26,22,0.09)",
            }
      }
    >
      <div
        className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[19px] shrink-0"
        style={{
          background: primary ? "rgba(255,255,255,0.2)" : "var(--color-ivory-warm)",
        }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-extrabold"
          style={{ color: primary ? "white" : "var(--color-ink)" }}
        >
          {title}
        </p>
        <p
          className="text-[11.5px] font-medium mt-0.5 truncate"
          style={{ color: primary ? "rgba(255,255,255,0.78)" : "var(--color-ink-faint)" }}
        >
          {subtitle}
        </p>
      </div>
      <span
        className="text-[15px] shrink-0"
        style={{ color: primary ? "white" : "var(--color-ink-faint)" }}
      >
        <Icon name="chevron-right" size={18} />
      </span>
    </button>
  );
}

export default function HomePage() {
  const { user, savedItineraries } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="머물;경" />
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4">
        <h2
          className="text-[24px] font-extrabold mt-3 mb-2 leading-tight tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          {user.nickname}님, 다시
          <br />
          어디로 떠나볼까요?
        </h2>
        <p
          className="text-[13px] mb-6 font-medium"
          style={{ color: "var(--color-ink-soft)" }}
        >
          새 여행을 계획하거나 저장해둔 일정을 확인해보세요
        </p>

        <div className="space-y-2.5">
          <HubCard
            icon="sparkles"
            title="새 일정 추가하기"
            subtitle="취향 선택부터 시작해요"
            primary
            onClick={() => navigate("/plan")}
          />
          <HubCard
            icon="bookmark"
            title="저장한 일정 보기"
            subtitle={
              savedItineraries.length > 0
                ? `${savedItineraries.length}개의 일정을 저장했어요`
                : "저장한 일정이 없어요"
            }
            onClick={() => navigate("/my/saved")}
          />
          <HubCard
            icon="map"
            title="지난 여행 보기"
            subtitle={
              user.trips.length > 0
                ? `${user.trips.length}번의 여행을 완료했어요`
                : "완료한 여행이 없어요"
            }
            onClick={() => navigate("/my/trips")}
          />
        </div>
      </div>
      <BottomNav />
    </>
  );
}
