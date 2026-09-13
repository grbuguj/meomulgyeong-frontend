import type { ReactNode } from "react";

/**
 * 앱 셸.
 * 모바일에서는 화면을 가장자리까지 꽉 채우고, 데스크톱에서만 기기 프레임으로 보여준다.
 * 높이를 확정해야 각 페이지의 `flex-1 overflow-y-auto` 내부 스크롤이 동작한다.
 */
export default function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="phone-shell">
      <div className="phone-shell__screen">{children}</div>
    </div>
  );
}
