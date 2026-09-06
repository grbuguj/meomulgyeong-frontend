/**
 * 공통 API 클라이언트
 * - 안재일(인증·회원), 혜일(여행조건·지역추천) 파트 백엔드(Spring Boot)를 fetch로 호출하기 위한 공용 레이어
 * - 백엔드 저장소: https://github.com/meomul-kyung/back (develop 브랜치 기준 스펙 반영)
 *
 * 환경변수:
 *   VITE_API_BASE_URL  예) http://localhost:8080 (로컬), 배포 후 실제 서버 주소로 교체
 */

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const ACCESS_TOKEN_KEY = "meomulgyeong_access_token";

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // storage 사용 불가 — 세션 내 메모리로만 동작 (새로고침 시 재로그인 필요)
  }
}

export function clearAccessToken(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // no-op
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** 인증 헤더 없이 호출해야 하는 공개 엔드포인트(GET /api/travel-options 등) */
  auth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

/**
 * 백엔드 공통 에러 포맷: { message: string } (GlobalExceptionHandler 기준)
 * 401은 토큰 만료/부재로 간주해 로컬 토큰을 정리한다. (리다이렉트는 호출부에서 처리)
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearAccessToken();
  }

  // 204 No Content 등 바디 없는 응답 처리
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.message as string)) || `요청 실패 (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export { API_BASE_URL };
