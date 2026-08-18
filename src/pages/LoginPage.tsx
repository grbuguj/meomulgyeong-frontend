import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";

const SOCIAL_BUTTONS: {
  key: "google" | "kakao" | "naver";
  label: string;
  bg: string;
  text: string;
  border?: string;
}[] = [
  { key: "kakao", label: "카카오로 시작하기", bg: "#FEE500", text: "#391B1B" },
  { key: "naver", label: "네이버로 시작하기", bg: "#03C75A", text: "#FFFFFF" },
  { key: "google", label: "Google로 시작하기", bg: "rgba(255,255,255,0.88)", text: "#3C3C3C", border: "1px solid rgba(60,60,60,0.12)" },
];

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = (provider: "google" | "kakao" | "naver") => {
    login(provider);
    navigate("/onboarding");
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Animated gradient bg */}
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          background:
            "linear-gradient(-48deg, #f0e8d8, #e4f0e8, #dde8f4, #f4ede0, #e8f4e4, #f0e4d8)",
        }}
      />

      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,1) 40px, rgba(0,0,0,1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,1) 40px, rgba(0,0,0,1) 41px)",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col justify-between px-7 py-10">
        {/* Brand */}
        <div className="mt-8 text-center">
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase mb-4"
            style={{ color: "var(--color-forest)" }}
          >
            경상북도 · 인구감소지역 체류형 여행
          </p>
          <h1
            className="font-serif-kr text-[52px] leading-none tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            머물;경
          </h1>
          <p
            className="text-[12px] mt-1.5 tracking-widest font-medium"
            style={{ color: "var(--color-ink-muted)" }}
          >
            慶尙北道
          </p>
          <p
            className="text-[13.5px] mt-5 leading-relaxed font-medium"
            style={{ color: "var(--color-ink-soft)" }}
          >
            잠깐 다녀오는 게 아니라, 여행은 여행.
            <br />
            경상북도 15개 인구감소지역에서.
          </p>
        </div>

        {/* Hero illustration */}
        <div className="flex justify-center">
          <div
            className="animate-float"
            style={{
              width: 180,
              height: 180,
              borderRadius: 40,
              overflow: "hidden",
              boxShadow: "0 24px 64px -16px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.7)",
            }}
          >
            <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
              <defs>
                <linearGradient id="lsk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d0e22" />
                  <stop offset="55%" stopColor="#1a2040" />
                  <stop offset="100%" stopColor="#2c3a50" />
                </linearGradient>
                <radialGradient id="lmn" cx="72%" cy="26%" r="24%">
                  <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.92" />
                  <stop offset="40%" stopColor="#fff8d0" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#fff8d0" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="lmw" cx="46%" cy="38%" r="60%">
                  <stop offset="0%" stopColor="#7060b8" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="200" height="200" fill="url(#lsk)" />
              <ellipse cx="100" cy="72" rx="140" ry="56" fill="url(#lmw)" transform="rotate(-10 100 72)" />
              {/* Moon */}
              <circle cx="144" cy="52" r="20" fill="url(#lmn)" />
              <circle cx="144" cy="52" r="10" fill="#fff8d0" fillOpacity="0.9" />
              {/* Stars */}
              {[
                [28, 28, 1.6], [55, 18, 1.0], [80, 34, 0.7], [108, 22, 1.4],
                [168, 30, 1.0], [185, 16, 1.6], [40, 52, 0.7], [68, 60, 1.0],
                [92, 45, 0.7], [175, 48, 0.7], [20, 68, 1.2], [130, 40, 0.7],
              ].map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="white" fillOpacity={0.5 + (i % 3) * 0.2} />
              ))}
              {/* Mountain silhouette */}
              <path
                d="M0 200 L0 140 L28 118 L58 132 L85 108 L112 124 L138 100 L164 116 L188 105 L200 110 L200 200 Z"
                fill="#0d0e22"
              />
              {/* Hanok rooftop */}
              <path d="M65 148 L95 132 L125 148 L120 148 L95 134 L70 148 Z" fill="#182030" />
              <rect x="70" y="148" width="50" height="36" rx="1" fill="#182030" />
              <rect x="88" y="162" width="14" height="22" rx="2" fill="#141a28" />
              {/* Lantern */}
              <circle cx="82" cy="135" r="3" fill="#ffaa44" fillOpacity="0.7" />
              <circle cx="108" cy="133" r="3" fill="#ffaa44" fillOpacity="0.7" />
              {/* Stars (lower) */}
              {[
                [155, 72, 0.8], [172, 84, 0.6], [182, 65, 1.0],
              ].map(([x, y, r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="white" fillOpacity="0.45" />
              ))}
            </svg>
          </div>
        </div>

        {/* Login buttons */}
        <div className="space-y-2.5">
          {SOCIAL_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleLogin(btn.key)}
              className="w-full py-4 rounded-[18px] font-bold text-[14.5px] tap"
              style={{
                background: btn.bg,
                color: btn.text,
                border: btn.border,
                boxShadow: "0 2px 12px -4px rgba(0,0,0,0.14)",
              }}
            >
              {btn.label}
            </button>
          ))}
          <p
            className="text-center text-[10.5px] pt-2 font-medium"
            style={{ color: "var(--color-ink-faint)" }}
          >
            로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
