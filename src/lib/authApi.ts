/**
 * 안재일) 인증·회원 API 연동
 * 대응 노션 표: 소셜 로그인 / 토큰 재발급(폐기) / 로그아웃 / 닉네임 중복확인 / 최초 닉네임 등록 / 개인정보 수정 / 내 정보 조회
 * 백엔드 소스: back-main(develop) — auth/controller/AuthController.java, user/controller/UserController.java
 */
import { apiFetch, clearAccessToken, API_BASE_URL } from "./apiClient";

export type SocialProvider = "google" | "kakao" | "naver";

export interface MeResponse {
  id: number;
  email: string | null;
  name: string;
  nickname: string | null;
  profileImageUrl: string | null;
  provider: SocialProvider;
  role: string;
  onboardingCompleted: boolean;
}

export interface NicknameAvailabilityResponse {
  nickname: string;
  available: boolean;
}

/**
 * 소셜 로그인 시작 — 백엔드가 카카오/구글/네이버 인가 화면으로 리다이렉트시키고,
 * 로그인 성공 후 프론트 콜백(app.oauth2.redirect-uri, 기본 "/oauth/callback")으로
 * ?accessToken=... 쿼리와 함께 되돌아온다. (Access Token 재발급 API는 노션 표 기준 폐기됨 — refresh 없음)
 */
export function startSocialLogin(provider: SocialProvider): void {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
}

/** 로그아웃 — 서버에 별도 세션이 없는 JWT 방식이라 클라이언트 토큰 삭제로 처리 */
export function logoutLocally(): void {
  clearAccessToken();
}

/** 현재 로그인한 회원 정보 + 온보딩(닉네임 등록) 완료 여부 조회 */
export function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/users/me");
}

/** 닉네임 사용 가능 여부 확인 (형식 검증 + 본인 제외 중복 확인은 서버에서 수행) */
export function checkNicknameAvailability(nickname: string): Promise<NicknameAvailabilityResponse> {
  return apiFetch<NicknameAvailabilityResponse>("/api/users/nickname-availability", {
    query: { nickname },
  });
}

/** 최초 닉네임 등록(온보딩). 이미 등록된 회원이면 서버가 409로 거부한다. */
export function registerOnboardingNickname(nickname: string): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/users/me/onboarding", {
    method: "PATCH",
    body: { nickname },
  });
}

/** 이름·닉네임 수정 (전달한 필드만 반영됨) */
export function updateProfile(fields: { name?: string; nickname?: string }): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/users/me", {
    method: "PATCH",
    body: fields,
  });
}
