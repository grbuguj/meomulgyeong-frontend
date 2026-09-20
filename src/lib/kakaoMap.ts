/**
 * 카카오 지도 JavaScript SDK 로더.
 *
 * SDK는 <script> 태그로만 주입할 수 있어서, 앱 전체에서 딱 한 번만 붙이고
 * 이후 호출은 같은 Promise를 재사용한다. (지도 컴포넌트가 여러 개 떠도 스크립트는 1개)
 *
 * 필요한 환경변수: VITE_KAKAO_MAP_KEY (카카오 개발자 콘솔의 JavaScript 키)
 * 키를 발급받더라도 콘솔 > 플랫폼 > Web 에 현재 접속 도메인이 등록돼 있지 않으면
 * SDK가 인증 오류를 내며 지도가 그려지지 않는다.
 */

const SDK_URL = "https://dapi.kakao.com/v2/maps/sdk.js";

let loaderPromise: Promise<typeof kakao.maps> | null = null;

/** 지도 키가 설정돼 있는지 — 키가 없으면 지도를 시도하지 않고 대체 UI로 넘어간다. */
export function hasKakaoMapKey(): boolean {
  return Boolean(readKey());
}

function readKey(): string | null {
  const key = import.meta.env.VITE_KAKAO_MAP_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

export function loadKakaoMaps(): Promise<typeof kakao.maps> {
  if (loaderPromise) return loaderPromise;

  const key = readKey();
  if (!key) {
    return Promise.reject(new Error("VITE_KAKAO_MAP_KEY가 설정되지 않았습니다."));
  }

  loaderPromise = new Promise<typeof kakao.maps>((resolve, reject) => {
    // 다른 경로로 이미 로드된 경우(HMR 등) 스크립트를 중복으로 붙이지 않는다.
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
      return;
    }

    const script = document.createElement("script");
    script.src = `${SDK_URL}?appkey=${key}&autoload=false`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        loaderPromise = null;
        reject(new Error("카카오 지도 SDK 초기화에 실패했습니다."));
        return;
      }
      // autoload=false이므로 load() 콜백 이후에야 kakao.maps.* 생성자를 쓸 수 있다.
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };
    script.onerror = () => {
      // 실패한 Promise를 캐시해두면 이후 재시도가 영원히 막히므로 초기화한다.
      loaderPromise = null;
      reject(new Error("카카오 지도 SDK를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}
