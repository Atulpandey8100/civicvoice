import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Plus, BarChart3, PieChart, ClipboardList, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import IssueCard from '../components/IssueCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { CATEGORIES, SORTS } from '../utils/priority';

const STATUS_STYLE = {
  pending: { label: 'Pending', color: '#f59e0b' },
  'in-progress': { label: 'In Progress', color: '#38bdf8' },
  resolved: { label: 'Resolved', color: '#34d399' },
  closed: { label: 'Closed', color: '#94a3b8' }
};

const CATEGORY_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#94a3b8'];

function StatusDonut({ counts, total }) {
  if (!total) return null;
  let acc = 0;
  const segments = Object.keys(STATUS_STYLE)
    .map((status) => {
      const count = counts[status] || 0;
      const start = (acc / total) * 360;
      acc += count;
      return { status, count, start, end: (acc / total) * 360 };
    })
    .filter((s) => s.count > 0);
  const gradient = segments
    .map((s) => `${STATUS_STYLE[s.status].color} ${s.start}deg ${s.end}deg`)
    .join(', ');

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label="Issues by status"
      >
        <div className="absolute inset-4 flex items-center justify-center rounded-full bg-surface">
          <div className="text-center">
            <p className="font-display text-2xl font-bold leading-none text-ink">{total}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Total</p>
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.status} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: STATUS_STYLE[s.status].color }}
              aria-hidden="true"
            />
            <span className="capitalize text-ink-soft">{STATUS_STYLE[s.status].label}</span>
            <span className="ml-auto font-semibold text-ink">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ExploreIssuesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || '';
  const [filter, setFilter] = useState({ category: '', status: urlStatus, sort: '-voteCount' });
  const [total, setTotal] = useState(0);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const requestIdRef = useRef(0);

  useEffect(() => {
    api
      .get('/issues/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    setFilter((prev) => (prev.status === urlStatus ? prev : { ...prev, status: urlStatus }));
  }, [urlStatus]);

  const fetchIssues = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      if (filter.status) params.set('status', filter.status);
      params.set('sort', filter.sort);
      params.set('page', '1');
      params.set('limit', '100');
      const { data } = await api.get(`/issues?${params}`);
      if (requestId !== requestIdRef.current) return;
      setTotal(data.total || 0);
      setIssues(data.issues || []);
      setError('');
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError('Failed to load issues. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleVote = async (issueId) => {
    if (!user) return;
    try {
      const { data } = await api.post(`/issues/${issueId}/vote`);
      setIssues((prev) => prev.map((i) => (i._id === issueId ? data : i)));
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Vote failed',
        description: err.response?.data?.error || 'Something went wrong while voting.'
      });
    }
  };

  const selectClass = "input cursor-pointer";

  const statusCounts = {};
  for (const item of stats?.statusBreakdown || []) statusCounts[item._id] = item.count;
  const totalIssues = stats?.totalIssues ?? 0;
  const categoryCounts = {};
  for (const item of stats?.categoryBreakdown || []) categoryCounts[item._id] = item.count;
  const categoryMax = Math.max(1, ...Object.values(categoryCounts));

  const issuesByStatus = {};
  for (const issue of issues) {
    if (!issuesByStatus[issue.status]) issuesByStatus[issue.status] = [];
    issuesByStatus[issue.status].push(issue);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Explore Issues</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Browse community issues by stage. {total} {total === 1 ? 'issue' : 'issues'} found.
          </p>
        </div>
        {user && (
          <Link to="/create" className="btn btn-primary">
            <Plus size={16} aria-hidden="true" />
            Report Issue
          </Link>
        )}
      </div>

      {statsLoading ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" aria-hidden="true" />
          <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" aria-hidden="true" />
        </div>
      ) : stats && totalIssues > 0 ? (
        <section aria-label="Issue statistics" className="mt-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <ClipboardList size={13} aria-hidden="true" />
                Total
              </p>
              <p className="mt-1.5 font-display text-2xl font-bold text-ink">{totalIssues}</p>
            </div>
            {Object.entries(STATUS_STYLE).map(([status, meta]) => (
              <div key={status} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                  {meta.label}
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold text-ink">{statusCounts[status] || 0}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
                <BarChart3 size={14} aria-hidden="true" />
                Issues by Category
              </h2>
              <div className="mt-4 space-y-3.5">
                {Object.entries(categoryCounts).length === 0 ? (
                  <p className="text-sm text-ink-soft">No data yet.</p>
                ) : (
                  Object.entries(categoryCounts).map(([cat, count], i) => {
                    const pct = Math.round((count / categoryMax) * 100);
                    return (
                      <div key={cat}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="capitalize text-ink-soft">{cat}</span>
                          <span className="font-semibold text-ink">{count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
                <PieChart size={14} aria-hidden="true" />
                Issues by Status
              </h2>
              <div className="mt-4">
                <StatusDonut counts={statusCounts} total={totalIssues} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-5 rounded-2xl border border-line bg-surface p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <SlidersHorizontal size={13} aria-hidden="true" />
            Filter
          </span>
          <select
            aria-label="Filter by category"
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className={`${selectClass} w-auto`}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          <select
            aria-label="Sort issues"
            value={filter.sort}
            onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
            className={`${selectClass} w-auto`}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3">
          <LoadingSkeleton count={3} variant="card" />
        </div>
      ) : error ? (
        <div className="mt-5">
          <EmptyState
            title="Could not load issues"
            description={error}
            action={{ label: 'Retry', onClick: () => fetchIssues() }}
          />
        </div>
      ) : issues.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No issues found"
            description="Be the first to report a community issue — or try clearing your filters."
            action={user ? { to: '/create', label: 'Report an Issue' } : { to: '/auth', label: 'Join CivicVoice' }}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-10">
          {Object.keys(STATUS_STYLE).map((status) => {
            const stageIssues = issuesByStatus[status] || [];
            const shown = filter.status ? stageIssues : stageIssues.slice(0, 3);

            if (filter.status && filter.status !== status) return null;
            if (!filter.status && stageIssues.length === 0) return null;

            return (
              <section key={status} aria-label={`${STATUS_STYLE[status].label} issues`}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_STYLE[status].color }} aria-hidden="true" />
                      {STATUS_STYLE[status].label}
                    </h2>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {stageIssues.length} {stageIssues.length === 1 ? 'issue' : 'issues'} in this stage
                    </p>
                  </div>
                  {!filter.status && stageIssues.length > 3 && (
                    <Link
                      to={`/issues?status=${status}`}
                      className="btn btn-sm btn-secondary"
                    >
                      View More
                      <ChevronRight size={14} aria-hidden="true" />
                    </Link>
                  )}
                </div>

                {shown.length > 0 ? (
                  <div className="mt-4 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {shown.map((issue) => (
                      <IssueCard key={issue._id} issue={issue} onVote={handleVote} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={`No ${STATUS_STYLE[status].label.toLowerCase()} issues`}
                    description="Check back soon — issues in this stage will appear here."
                  />
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
