import { Check } from 'lucide-react';

export default function StatusStepper({ status, onSelect }) {
  const steps = [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const currentIndex = steps.findIndex((s) => s.value === status);
  const editable = typeof onSelect === 'function';

  return (
    <ol className="flex w-full items-center" aria-label={`Issue status: ${status}`}>
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const color = current ? 'var(--accent)' : done ? 'var(--success)' : 'var(--ink-faint)';
        const labelColor = current ? 'text-ink' : done ? 'text-ink-soft' : 'text-ink-faint';

        return (
          <li key={step.value} className={`relative flex flex-1 flex-col items-center ${editable ? 'cursor-pointer' : ''}`}>
            {i > 0 && (
              <div
                className="absolute right-1/2 top-[11px] h-0.5 w-full"
                style={{ background: done || current ? color : 'var(--line-strong)' }}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              disabled={!editable}
              onClick={() => editable && onSelect(step.value)}
              aria-pressed={current}
              aria-current={current ? 'step' : undefined}
              aria-label={`${step.label}${current ? ' (current)' : ''}`}
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                editable ? 'hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent' : ''
              }`}
              style={{
                background: current || done ? color : 'var(--surface)',
                borderColor: current || done ? color : 'var(--line-strong)',
                color: '#fff'
              }}
            >
              {done ? <Check size={13} aria-hidden="true" /> : <span className="text-[11px] font-bold">{i + 1}</span>}
            </button>
            <span className={`mt-1.5 hidden text-center text-[11px] font-medium sm:block ${labelColor}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
