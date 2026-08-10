import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import IssueCard from '../components/IssueCard';
import IssueMap from '../components/IssueMap';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { CATEGORIES, STATUSES, SORTS } from '../utils/priority';

export default function HomePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState({ category: '', status: '', sort: '-voteCount' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const PAGE_SIZE = 20;
  const requestIdRef = useRef(0);
  const latestIssueIdRef = useRef(null); // sabse upar wale issue ki id track karta hai
  const filterRef = useRef(filter); // polling ke andar latest filter use karne ke liye
  const knownIdsRef = useRef(new Set()); // duplicate check ke liye

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

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
      setIssues((prev) => {
        const next = targetPage === 1 ? (data.issues || []) : [...prev, ...(data.issues || [])];
        knownIdsRef.current = new Set(next.map((i) => i._id));
        return next;
      });

      if (data.issues?.[0]) {
        latestIssueIdRef.current = data.issues[0]._id;
      }
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

  // 👇 Background check — sirf tab naye issues ko live list mein daalega jab default sort/filter ho
  const checkForNewIssues = useCallback(async () => {
    // Sirf default view (no filter, default sort) pe hi auto-insert karo,
    // custom filter/sort mein karne se list ka order confuse ho sakta hai.
    if (filterRef.current.category || filterRef.current.status || filterRef.current.sort !== '-voteCount') {
      return;
    }

    try {
      const { data } = await api.get(`/issues?sort=-createdAt&page=1&limit=5`);
      const fresh = (data.issues || []).filter((i) => !knownIdsRef.current.has(i._id));

      if (fresh.length > 0) {
        setIssues((prev) => {
          const merged = [...fresh, ...prev];
          knownIdsRef.current = new Set(merged.map((i) => i._id));
          return merged;
        });
        setTotal((t) => t + fresh.length);
        latestIssueIdRef.current = fresh[0]._id;
      }
    } catch {
      // silent fail — background poll ke error se user ko disturb mat karo
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchIssues(1);
  }, [fetchIssues]);

  // Apna khud ka post turant refresh kare (same tab, instant)
  useEffect(() => {
    const handler = () => {
      setPage(1);
      fetchIssues(1);
    };
    window.addEventListener('civicvoice:issue-created', handler);
    return () => window.removeEventListener('civicvoice:issue-created', handler);
  }, [fetchIssues]);

  // Dusre users ke posts ke liye background polling
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewIssues();
    }, 8000); // har 8 second check karega
    return () => clearInterval(interval);
  }, [checkForNewIssues]);

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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:flex lg:gap-6">
      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-[46%] lg:shrink-0">
        <IssueMap issues={issues} className="h-[340px] lg:h-full" height="100%" />
      </div>

      <section className="mt-6 lg:mt-0 lg:min-w-0 lg:flex-1" aria-label="Issues list">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Community Issues</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
              <MapPin size={14} aria-hidden="true" />
              {total} {total === 1 ? 'issue' : 'issues'} · pin color = AI priority
            </p>
          </div>
          {user && (
            <Link to="/create" className="btn btn-primary">
              <Plus size={16} aria-hidden="true" />
              Report Issue
            </Link>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-surface p-3 shadow-card">
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
          <div className="mt-5 flex justify-center">
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
      </section>
    </div>
  );
}
