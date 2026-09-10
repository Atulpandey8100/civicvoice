import { Landmark } from 'lucide-react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-card ${className}`}
      style={{ width: size, height: size }}
    >
      <Landmark size={Math.max(14, Math.round(size * 0.55))} strokeWidth={2} />
    </span>
  );
}
