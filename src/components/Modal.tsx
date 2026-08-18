import type { ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center"
      style={{ background: "rgba(16,14,10,0.52)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-[32px] p-5 pb-10 max-h-[88%] overflow-y-auto"
        style={{ animation: "slideUp 0.26s cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* Handle */}
        <div
          className="w-9 h-1 rounded-full mx-auto mb-5"
          style={{ background: "var(--color-line)" }}
        />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-bold" style={{ color: "var(--color-ink)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center tap text-base font-bold"
            style={{
              background: "var(--color-ivory-warm)",
              color: "var(--color-ink-soft)",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
