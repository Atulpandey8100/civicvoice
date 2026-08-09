import { Link } from 'react-router-dom';
import { Flag, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreateIssuePage from './CreateIssuePage';
import EmptyState from '../components/EmptyState';

export default function ReportIssuePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={UserRound}
          title="Sign in to report an issue"
          description="Create an account to describe a problem in your community, pin its location, and let Gemini AI assess priority with solutions."
          action={{ to: '/auth', label: 'Sign in / Register' }}
        />
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-sm text-ink-soft">
          <Flag size={13} aria-hidden="true" />
          Already signed in? <Link to="/report" className="font-semibold text-accent hover:underline">Refresh</Link>
        </p>
      </div>
    );
  }

  return <CreateIssuePage />;
}
