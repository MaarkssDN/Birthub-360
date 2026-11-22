import { motion } from 'framer-motion';

export function DataFlowLines({ className }: { className?: string }) {
  const lines = [
    { x1: 0, y1: 25, x2: 100, y2: 25, delay: 0 },
    { x1: 0, y1: 50, x2: 100, y2: 50, delay: 0.4 },
    { x1: 0, y1: 75, x2: 100, y2: 75, delay: 0.8 },
  ];

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className ?? ''}`}
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <motion.line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="rgba(22,119,255,0.08)"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1.6, delay: l.delay, ease: 'easeOut' },
            opacity: { duration: 0.4, delay: l.delay },
          }}
        />
      ))}
    </svg>
  );
}
