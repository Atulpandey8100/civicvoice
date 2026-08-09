import { Compass } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={{ to: '/', label: 'Back to Home' }}
      />
    </div>
  );
}
