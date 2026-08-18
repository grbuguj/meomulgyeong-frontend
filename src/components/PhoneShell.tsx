import type { ReactNode } from "react";

export default function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center py-6 px-2"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #c8c0ad 0%, #b0a894 40%, #9e9688 100%)",
      }}
    >
      <div
        className="w-full max-w-[420px] min-h-[780px] flex flex-col relative"
        style={{
          background: "var(--color-ivory)",
          borderRadius: 38,
          overflow: "hidden",
          boxShadow:
            "0 40px 80px -20px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 1px rgba(255,255,255,0.15)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
