import { motion } from "framer-motion";

interface Props {
  value: number; // 0-100
  size?: number;
  label?: string;
  sublabel?: string;
}

/**
 * Premium semicircular trust score ring with animated stroke fill.
 * Uses semantic tokens — color shifts based on score tier.
 */
export function TrustScoreRing({ value, size = 132, label, sublabel }: Props) {
  const safe = Math.max(0, Math.min(100, value));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // semicircle
  const dash = (safe / 100) * circumference;

  const tier =
    safe >= 80 ? { color: "hsl(142 71% 45%)", tone: "Excelent" } :
    safe >= 50 ? { color: "hsl(var(--primary))", tone: "Bun" } :
    { color: "hsl(38 92% 50%)", tone: "În progres" };

  const cx = size / 2;
  const cy = size / 2;
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;

  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size / 2 + 32 }}>
      <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
        {/* Track */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${startY}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress */}
        <motion.path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${startY}`}
          fill="none"
          stroke={tier.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Center value — sits inside the top semicircle */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
        >
          {safe}
        </text>
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}
        >
          {label || "Trust"}
        </text>
      </svg>
      <p className="text-xs font-medium mt-1" style={{ color: tier.color }}>
        {sublabel || tier.tone}
      </p>
    </div>
  );
}