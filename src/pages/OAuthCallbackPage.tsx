import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAccessToken } from "../lib/apiClient";
import { useApp } from "../store/AppContext";

/**
 * 백엔드 OAuth2SuccessHandler가 로그인 성공 후 리다이렉트하는 콜백 화면.
 * app.oauth2.redirect-uri 기본값: "{프론트배포주소}/oauth/callback?accessToken=..."
 * 이 라우트를 App.tsx에 등록해야 한다.
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshMe, hasOnboarded } = useApp();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const accessToken = searchParams.get("accessToken");
    if (!accessToken) {
      setError("로그인 토큰을 받지 못했습니다.");
      return;
    }

    setAccessToken(accessToken);
    refreshMe().then(() => {
      // hasOnboarded는 refreshMe 완료 시점의 상태를 즉시 참조하기 어려우므로
      // /api/users/me를 다시 확인해 분기한다(useApp 최신값은 다음 렌더에 반영됨).
      navigate("/onboarding", { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // refreshMe 완료 후 실제로는 App.tsx의 Gate가 hasOnboarded를 보고 /home으로 다시 보내준다.
  useEffect(() => {
    if (hasOnboarded) navigate("/home", { replace: true });
  }, [hasOnboarded, navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
      {error ? (
        <>
          <p className="text-[14px] font-bold" style={{ color: "var(--color-ink)" }}>
            로그인에 실패했습니다
          </p>
          <p className="text-[12.5px]" style={{ color: "var(--color-ink-soft)" }}>
            {error}
          </p>
          <button
            className="mt-2 text-[12.5px] font-bold underline"
            style={{ color: "var(--color-accent)" }}
            onClick={() => navigate("/login", { replace: true })}
          >
            로그인 화면으로 돌아가기
          </button>
        </>
      ) : (
        <p className="text-[13px] font-semibold" style={{ color: "var(--color-ink-soft)" }}>
          로그인 처리 중이에요…
        </p>
      )}
    </div>
  );
}
