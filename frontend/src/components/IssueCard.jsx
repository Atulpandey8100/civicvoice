import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PriorityBar from './PriorityBar';
import { priorityLabel, priorityColor } from '../utils/priority';

export default function IssueCard({ issue, onVote }) {
  const { user } = useAuth();
  const [animating, setAnimating] = useState(false);

  const hasVoted = issue.votes?.includes(user?.id);
  const color = priorityColor(issue.aiPriority);
  const hasCoords = issue.location?.coordinates?.length === 2 && issue.location.coordinates[0] !== 0 && issue.location.coordinates[1] !== 0;

  const handleVote = () => {
    if (!user || animating) return;
    setAnimating(true);
    onVote?.(issue._id);
    setTimeout(() => setAnimating(false), 450);
  };

  return (
    <article className="card card-hover p-5">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/issues/${issue._id}`} className="group">
            <h3 className="font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
              {issue.title}
            </h3>
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <span className="rounded-full bg-surface-3 px-2.5 py-0.5 font-medium capitalize text-ink-soft">
              {issue.category}
            </span>
            <span>by {issue.author?.name || 'Anonymous'}</span>
            <span aria-hidden="true">·</span>
            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <span className={`badge badge-${issue.status}`}>{issue.status}</span>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
        {issue.description}
      </p>

      {hasCoords && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-faint">
          <MapPin size={12} aria-hidden="true" />
          {issue.location.address || `${issue.location.coordinates[1].toFixed(4)}, ${issue.location.coordinates[0].toFixed(4)}`}
        </p>
      )}

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-ink-soft">AI Priority</span>
          <span className="font-semibold" style={{ color }}>
            {priorityLabel(issue.aiPriority)} · {issue.aiPriority}/10
          </span>
        </div>
        <PriorityBar score={issue.aiPriority} size="sm" showLabel={false} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleVote}
          disabled={!user}
          aria-label={hasVoted ? 'Remove your vote' : 'Vote for this issue'}
          aria-pressed={hasVoted}
          className={`vote-btn ${hasVoted ? 'voted' : ''} ${animating ? 'animate-pop-in' : ''}`}
        >
          <ThumbsUp size={14} fill={hasVoted ? 'currentColor' : 'none'} aria-hidden="true" />
          {issue.voteCount} {issue.voteCount === 1 ? 'vote' : 'votes'}
        </button>

        {issue.aiSuggestions?.length > 0 && (
          <Link
            to={`/issues/${issue._id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-accent"
          >
            <Sparkles size={13} aria-hidden="true" />
            {issue.aiSuggestions.length} AI {issue.aiSuggestions.length === 1 ? 'solution' : 'solutions'}
          </Link>
        )}
      </div>
    </article>
  );
}
