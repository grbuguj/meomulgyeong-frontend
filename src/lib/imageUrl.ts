/**
 * 외부 이미지 주소를 https로 맞춘다.
 *
 * 한국관광공사(TourAPI)는 이미지 주소를 http로 내려주는데, 배포 사이트는 https라
 * 브라우저가 혼합 콘텐츠로 막거나 자동 업그레이드하면서 사진이 비어 보인다.
 * 해당 호스트는 https로도 같은 파일을 제공하므로 앞부분만 바꿔 쓴다.
 */
export function toSecureUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http://") ? `https://${url.slice("http://".length)}` : url;
}
