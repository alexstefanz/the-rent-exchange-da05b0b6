import { useEffect, useMemo, useState } from "react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 71% 45%)", "hsl(var(--foreground))", "hsl(var(--primary) / 0.6)"];

interface ConfettiProps {
  /** Unique key; when set, confetti plays only once per browser for this key. */
  onceKey?: string;
  pieces?: number;
  durationMs?: number;
}

/** Full-screen confetti burst (CSS only). Respects prefers-reduced-motion. */
const Confetti = ({ onceKey, pieces = 90, durationMs = 4200 }: ConfettiProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (onceKey) {
      const k = `rentli-confetti-${onceKey}`;
      try {
        if (localStorage.getItem(k)) return;
        localStorage.setItem(k, "1");
      } catch { /* noop */ }
    }
    setShow(true);
    const tm = setTimeout(() => setShow(false), durationMs + 1200);
    return () => clearTimeout(tm);
  }, [onceKey, durationMs]);

  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 900}ms`,
        duration: `${durationMs * (0.6 + Math.random() * 0.4)}ms`,
        rotate: `${Math.random() * 360}deg`,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
      })),
    [pieces, durationMs],
  );

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      <style>{`@keyframes rentli-confetti-fall{0%{opacity:0;transform:translateY(-2rem) rotate(0)}8%{opacity:1}100%{opacity:0;transform:translate(3rem,110vh) rotate(900deg)}}`}</style>
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute -top-6 rounded-[2px]"
          style={{
            left: p.left,
            width: p.w,
            height: p.h,
            background: p.color,
            rotate: p.rotate,
            animation: `rentli-confetti-fall ${p.duration} cubic-bezier(.25,.4,.5,1) ${p.delay} both`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
