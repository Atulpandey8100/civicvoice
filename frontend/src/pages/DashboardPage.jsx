import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Layers } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import IssueCard from '../components/IssueCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { CATEGORIES, STATUSES } from '../utils/priority';

const statusLabel = (key) => STATUSES.find((s) => s.value === key)?.label || key;
const categoryLabel = (key) => CATEGORIES.find((c) => c.value === key)?.label || key;

const STATUS_COLORS = {
  pending: 'var(--status-pending-ink)',
  'in-progress': 'var(--status-in-progress-ink)',
  resolved: 'var(--status-resolved-ink)',
  closed: 'var(--status-closed-ink)'
};

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const fetchStats = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const { data } = await api.get('/issues/stats');
      if (requestId !== requestIdRef.current) return;
      setStats(data);
      setError('');
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleVote = async (issueId) => {
    try {
      const { data } = await api.post(`/issues/${issueId}/vote`);
      setStats((prev) => ({
        ...prev,
        recentIssues: (prev.recentIssues || []).map((i) => (i._id === issueId ? data : i))
      }));
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Vote failed',
        description: err.response?.data?.error || 'Something went wrong while voting.'
      });
    }
  };

  const totalByStatus = (stats?.statusBreakdown || []).reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  const totalByCategory = (stats?.categoryBreakdown || []).reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {});
  const maxCategory = Math.max(1, ...(stats?.categoryBreakdown || []).map((c) => c.count));
  const total = stats?.totalIssues || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <TrendingUp size={14} aria-hidden="true" />
            Community activity, statuses, and AI priorities at a glance
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6">
          <LoadingSkeleton count={2} variant="card" />
        </div>
      ) : error ? (
        <div className="mt-6">
          <EmptyState
            title="Could not load dashboard"
            description={error}
            action={{ label: 'Retry', onClick: () => { setLoading(true); fetchStats(); } }}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div className="stat-card">
              <h3>{total}</h3>
              <p>Total issues</p>
            </div>
            {STATUSES.map((s) => (
              <div className="stat-card" key={s.value}>
                <h3>{totalByStatus[s.value] || 0}</h3>
                <p style={{ color: STATUS_COLORS[s.value] }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="card p-6" aria-label="Issues by category">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
                <Layers size={15} aria-hidden="true" />
                Issues by category
              </h2>
              <div className="mt-4 space-y-3">
                {(stats?.categoryBreakdown || []).length === 0 ? (
                  <p className="text-sm text-ink-soft">No issues yet.</p>
                ) : (
                  stats.categoryBreakdown.map((c) => (
                    <div key={c._id} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 text-sm capitalize text-ink-soft">{categoryLabel(c._id)}</span>
                      <div className="priority-bar flex-1">
                        <div
                          className="priority-fill"
                          style={{
                            width: `${Math.round((c.count / maxCategory) * 100)}%`,
                            background: 'var(--accent)'
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold text-ink">{c.count}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card p-6" aria-label="Issue status breakdown">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
                <LayoutDashboard size={15} aria-hidden="true" />
                Status breakdown
              </h2>
              <div className="mt-4 flex h-4 overflow-hidden rounded-full border border-line">
                {STATUSES.map((s) => {
                  const count = totalByStatus[s.value] || 0;
                  if (!count || !total) return null;
                  return (
                    <div
                      key={s.value}
                      style={{
                        width: `${(count / total) * 100}%`,
                        background: STATUS_COLORS[s.value]
                      }}
                      title={`${s.label}: ${count}`}
                    />
                  );
                })}
              </div>
              <ul className="mt-4 space-y-2">
                {STATUSES.map((s) => (
                  <li key={s.value} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-soft">
                      <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLORS[s.value] }} aria-hidden="true" />
                      {s.label}
                    </span>
                    <span className="font-semibold text-ink">{totalByStatus[s.value] || 0}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-6" aria-label="Recent issues">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">Recent issues</h2>
            <div className="mt-4 space-y-3">
              {(stats?.recentIssues || []).length === 0 ? (
                <EmptyState
                  title="No issues reported yet"
                  description="Be the first to report a community issue."
                />
              ) : (
                stats.recentIssues.map((issue) => (
                  <IssueCard key={issue._id} issue={issue} onVote={handleVote} />
                ))
              )}
            </div>
          </section>

          <p className="mt-6 text-center">
            <Link to="/map" className="text-sm font-semibold text-accent hover:underline">
              Open the community map →
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
