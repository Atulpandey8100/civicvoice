import { priorityColor, priorityLabel } from '../utils/priority';

const SIZES = {
  sm: { track: 'h-1.5', handle: 'h-3.5 w-3.5', text: 'text-xs' },
  md: { track: 'h-2.5', handle: 'h-4 w-4', text: 'text-sm' },
  lg: { track: 'h-3.5', handle: 'h-5 w-5', text: 'text-base' }
};

export default function PriorityBar({ score = 0, size = 'md', showLabel = true, className = '' }) {
  const clamped = Math.max(0, Math.min(10, Math.round(score || 0)));
  const pct = clamped * 10;
  const color = priorityColor(score);
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={className}>
      <div
        className={`relative w-full ${s.track} rounded-full`}
        style={{
          background: 'linear-gradient(90deg, var(--priority-low), var(--priority-mid), var(--priority-high))',
          opacity: 0.9
        }}
        role="img"
        aria-label={`AI priority score ${clamped} out of 10 (${priorityLabel(score)})`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 25%, transparent), ${color})`
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-surface shadow-pop transition-all duration-500 ease-out"
          style={{
            left: `${pct}%`,
            transform: pct <= 0 ? 'translate(0, -50%)' : pct >= 100 ? 'translate(-100%, -50%)' : 'translate(-50%, -50%)',
            background: color,
            width: s.handle,
            height: s.handle
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className={`font-semibold ${s.text}`} style={{ color }}>
            {clamped}/10
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            {priorityLabel(score)}
          </span>
        </div>
      )}
    </div>
  );
}
