/**
 * 카카오 지도 JavaScript SDK 최소 타입 선언.
 * SDK는 npm 패키지가 아니라 <script>로 주입되므로 실제로 쓰는 API만 직접 선언한다.
 * 전체 스펙: https://apis.map.kakao.com/web/documentation/
 */
export {};

declare global {
  namespace kakao.maps {
    class LatLng {
      constructor(latitude: number, longitude: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      constructor();
      extend(latlng: LatLng): void;
      isEmpty(): boolean;
    }

    interface MapOptions {
      center: LatLng;
      level?: number;
      draggable?: boolean;
      zoomable?: boolean;
    }

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setBounds(
        bounds: LatLngBounds,
        paddingTop?: number,
        paddingRight?: number,
        paddingBottom?: number,
        paddingLeft?: number
      ): void;
      setDraggable(draggable: boolean): void;
      setZoomable(zoomable: boolean): void;
      relayout(): void;
    }

    interface PolylineOptions {
      path: LatLng[];
      strokeWeight?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeStyle?: "solid" | "shortdash" | "dash" | "dot";
    }

    class Polyline {
      constructor(options: PolylineOptions);
      setMap(map: Map | null): void;
    }

    interface CustomOverlayOptions {
      position: LatLng;
      content: string | HTMLElement;
      xAnchor?: number;
      yAnchor?: number;
      zIndex?: number;
      clickable?: boolean;
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
    }

    /** autoload=false로 로드했을 때 SDK 준비 완료를 알리는 콜백 */
    function load(callback: () => void): void;
  }

  interface Window {
    kakao?: { maps: typeof kakao.maps };
  }
}
