import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import IssueCard from '../components/IssueCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { CATEGORIES, STATUSES, SORTS } from '../utils/priority';

export default function ExploreIssuesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState({ category: '', status: '', sort: '-voteCount' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const PAGE_SIZE = 20;
  const requestIdRef = useRef(0);

  const fetchIssues = useCallback(async (targetPage = 1) => {
    const requestId = ++requestIdRef.current;
    if (targetPage === 1) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      if (filter.status) params.set('status', filter.status);
      params.set('sort', filter.sort);
      params.set('page', targetPage);
      params.set('limit', PAGE_SIZE);
      const { data } = await api.get(`/issues?${params}`);
      if (requestId !== requestIdRef.current) return false;
      setTotal(data.total || 0);
      setIssues((prev) => (targetPage === 1 ? (data.issues || []) : [...prev, ...(data.issues || [])]));
      setError('');
      return true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return false;
      setError('Failed to load issues. Please try again.');
      return false;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setPage(1);
    fetchIssues(1);
  }, [fetchIssues]);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const ok = await fetchIssues(nextPage);
    if (ok) setPage(nextPage);
    setLoadingMore(false);
  };

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Explore Issues</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Browse, filter, and sort community issues. {total} {total === 1 ? 'issue' : 'issues'} found.
          </p>
        </div>
        {user && (
          <Link to="/create" className="btn btn-primary">
            <Plus size={16} aria-hidden="true" />
            Report Issue
          </Link>
        )}
      </div>

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
          <select
            aria-label="Filter by status"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className={`${selectClass} w-auto`}
          >
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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

      <div className="mt-5 space-y-3">
        {loading ? (
          <LoadingSkeleton count={3} variant="card" />
        ) : error ? (
          <EmptyState
            title="Could not load issues"
            description={error}
            action={{ label: 'Retry', onClick: () => fetchIssues(1) }}
          />
        ) : issues.length === 0 ? (
          <EmptyState
            title="No issues found"
            description="Be the first to report a community issue — or try clearing your filters."
            action={user ? { to: '/create', label: 'Report an Issue' } : { to: '/auth', label: 'Join CivicVoice' }}
          />
        ) : (
          issues.map((issue) => (
            <IssueCard key={issue._id} issue={issue} onVote={handleVote} />
          ))
        )}
      </div>

      {!loading && !error && issues.length > 0 && issues.length < total && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="btn btn-secondary"
          >
            {loadingMore ? 'Loading…' : `Load more (${total - issues.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
