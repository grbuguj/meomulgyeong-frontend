export default function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-2 mb-6 items-center">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-400"
            style={{
              flex: isActive ? 2.2 : 1,
              background: isActive
                ? "linear-gradient(90deg, #3b82f6, var(--color-accent-dark))"
                : isDone
                ? "var(--color-accent-soft)"
                : "var(--color-line)",
              boxShadow: isActive ? "0 2px 8px -2px rgba(43,108,224,0.5)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
