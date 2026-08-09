import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-3 text-ink-faint">
        <Icon size={26} aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn btn-primary mt-5">{action.label}</Link>
        ) : (
          <button type="button" onClick={action.onClick} className="btn btn-primary mt-5">
            {action.label}
          </button>
        ))}
    </div>
  );
}
