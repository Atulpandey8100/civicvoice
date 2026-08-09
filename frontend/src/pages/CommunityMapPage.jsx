import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPinned, MapPin } from 'lucide-react';
import api from '../utils/api';
import IssueMap from '../components/IssueMap';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function CommunityMapPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const fetchIssues = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const params = new URLSearchParams({ page: '1', limit: '100', sort: '-voteCount' });
      const { data } = await api.get(`/issues?${params}`);
      if (requestId !== requestIdRef.current) return;
      setIssues(data.issues || []);
      setError('');
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError('Failed to load issues. Please try again.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const withCoords = issues.filter(
    (i) => i.location?.coordinates?.length === 2 && i.location.coordinates[0] !== 0 && i.location.coordinates[1] !== 0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Community Map</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPinned size={14} aria-hidden="true" />
            {withCoords.length} issues pinned · pin color = AI priority
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={1} variant="list" />
      ) : error ? (
        <div className="mt-5">
          <EmptyState
            title="Could not load the map"
            description={error}
            action={{ label: 'Retry', onClick: () => { setLoading(true); fetchIssues(); } }}
          />
        </div>
      ) : withCoords.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No issues pinned yet"
            description="Report an issue with a location to see it appear on the community map."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-[420px] lg:h-[560px]">
            <IssueMap issues={issues} className="h-full" height="100%" />
          </div>

          <aside aria-label="Issues list" className="min-w-0">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
              Top issues
            </h2>
            <ul className="mt-3 max-h-[540px] space-y-2 overflow-y-auto pr-1">
              {withCoords.map((issue) => (
                <li key={issue._id}>
                  <Link
                    to={`/issues/${issue._id}`}
                    className="card card-hover flex w-full flex-col p-3.5 text-left"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <MapPin size={13} className="shrink-0 text-accent" aria-hidden="true" />
                        <span className="line-clamp-1 text-sm">{issue.title}</span>
                      </span>
                      <span className={`badge badge-${issue.status} shrink-0`}>{issue.status}</span>
                    </span>
                    <span className="mt-1 block text-xs text-ink-faint">
                      {issue.category} · {issue.voteCount} votes · priority {issue.aiPriority}/10
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
