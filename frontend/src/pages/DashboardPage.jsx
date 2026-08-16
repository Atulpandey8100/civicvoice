import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, ClipboardList } from 'lucide-react';
import api from '../utils/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { CATEGORIES, STATUSES } from '../utils/priority';

const statusLabel = (key) => STATUSES.find((s) => s.value === key)?.label || key;
const categoryLabel = (key) => CATEGORIES.find((c) => c.value === key)?.label || key;

export default function DashboardPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyIssues = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/issues/my');
      setIssues(data);
      setError('');
    } catch (err) {
      setError('Failed to load your issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyIssues(); }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <ClipboardList size={14} aria-hidden="true" />
            Your reported issues and their progress
          </p>
        </div>
        <Link to="/create" className="btn btn-primary btn-sm">
          <Plus size={14} aria-hidden="true" />
          Report New Issue
        </Link>
      </div>

      {loading ? (
        <div className="mt-6">
          <LoadingSkeleton count={2} variant="card" />
        </div>
      ) : error ? (
        <div className="mt-6">
          <EmptyState
            title="Could not load your issues"
            description={error}
            action={{ label: 'Retry', onClick: fetchMyIssues }}
          />
        </div>
      ) : issues.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No issues reported yet"
            description="Report your first community issue and track its progress here."
            action={{ to: '/create', label: 'Report an Issue' }}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {issues.map((issue) => (
            <div key={issue._id} className="card card-hover p-5">
              <div className="issue-header">
                <div>
                  <Link to={`/issues/${issue._id}`} className="font-display text-base font-semibold text-ink hover:text-accent">
                    {issue.title}
                  </Link>
                  <div className="issue-meta">
                    <span className={`badge badge-${issue.status}`}>{statusLabel(issue.status)}</span>
                    <span>{categoryLabel(issue.category)}</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/issues/${issue._id}`} className="btn btn-sm btn-secondary">
                    <Eye size={14} aria-hidden="true" /> View
                  </Link>
                  <Link to={`/issues/${issue._id}/edit`} className="btn btn-sm btn-secondary">
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </Link>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                {issue.description}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-ink-soft">
                <span>Votes: {issue.voteCount}</span>
                <span>AI Priority: {issue.aiPriority}/10</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
