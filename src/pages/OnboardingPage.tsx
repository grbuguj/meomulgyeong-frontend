import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppContext";
import Button from "../components/Button";
import { checkNicknameAvailability } from "../lib/authApi";
import { ApiError } from "../lib/apiClient";

export default function OnboardingPage() {
  const { completeOnboarding, user } = useApp();
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const value = nickname.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { available } = await checkNicknameAvailability(value);
      if (!available) {
        setErrorMessage("이미 사용 중인 닉네임이에요.");
        return;
      }
      await completeOnboarding(value);
      navigate("/home");
    } catch (e) {
      setErrorMessage(e instanceof ApiError ? e.message : "닉네임 등록에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const providerLabel =
    user.loginProvider === "kakao"
      ? "카카오"
      : user.loginProvider === "naver"
      ? "네이버"
      : "Google";

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Animated bg */}
      <div
        className="absolute inset-0 animate-gradient"
        style={{
          background: "linear-gradient(-48deg, #f0e8d8, #e8f2ea, #dde8f4, #f4ede0)",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col justify-between px-7 py-14">
        {/* Header */}
        <div>
          <div
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(255,255,255,0.7)",
              color: "var(--color-forest)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(56,80,62,0.15)",
            }}
          >
            <span>✓</span>
            {providerLabel} 로그인 완료
          </div>

          <h1
            className="text-[28px] font-extrabold leading-tight tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            머물;경에서 사용할
            <br />
            닉네임을 알려주세요
          </h1>
          <p
            className="text-[13px] mt-3 leading-relaxed"
            style={{ color: "var(--color-ink-soft)" }}
          >
            여행 스탬프와 저장한 일정이 이 닉네임으로 기록돼요
          </p>
        </div>

        {/* Illustration */}
        <div className="flex justify-center">
          <div
            className="animate-float w-28 h-28 rounded-[32px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #e8f0ea, white)",
              boxShadow: "0 16px 48px -12px rgba(56,80,62,0.3), 0 0 0 1px rgba(255,255,255,0.8)",
              fontSize: 52,
            }}
          >
            🌿
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <div className="relative">
            <input
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="닉네임을 입력하세요"
              maxLength={12}
              className="w-full bg-transparent py-3 text-[22px] font-bold outline-none placeholder:font-medium placeholder:text-[var(--color-ink-faint)]"
              style={{
                color: "var(--color-ink)",
                borderBottom: "2.5px solid var(--color-accent)",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            {errorMessage ? (
              <p className="text-[11px] font-semibold" style={{ color: "#c0392b" }}>
                {errorMessage}
              </p>
            ) : (
              <span />
            )}
            <p
              className="text-right text-[11px] font-semibold"
              style={{ color: "var(--color-ink-faint)" }}
            >
              {nickname.length}/12
            </p>
          </div>
        </div>

        <Button variant="accent" fullWidth disabled={!nickname.trim() || submitting} onClick={handleSubmit}>
          {submitting ? "확인 중…" : "시작하기"}
        </Button>
      </div>
    </div>
  );
}
