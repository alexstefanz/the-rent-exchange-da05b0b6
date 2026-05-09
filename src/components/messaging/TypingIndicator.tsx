import { motion } from "framer-motion";

export function TypingIndicator({ name }: { name?: string | null }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2">
      <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      {name && <span className="text-xs text-muted-foreground">{name} scrie…</span>}
    </div>
  );
}