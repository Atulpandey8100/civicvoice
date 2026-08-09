import EmptyState from './EmptyState';

export default function PlaceholderPage({ icon, title, description }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={{ to: '/', label: 'Back to Home' }}
      />
    </div>
  );
}
