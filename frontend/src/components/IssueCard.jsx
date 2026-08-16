import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Sparkles, ImageOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { priorityLabel, priorityColor } from '../utils/priority';

export default function IssueCard({ issue, onVote }) {
  const { user } = useAuth();
  const [animating, setAnimating] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [view, setView] = useState('before');

  const hasVoted = issue.votes?.includes(user?.id);
  const color = priorityColor(issue.aiPriority);
  const afterImages = (issue.statusUpdates || []).flatMap((u) => u.images || []);
  const hasAfterImages = afterImages.length > 0;
  const photos = view === 'after' ? afterImages : issue.images;

  const switchView = (next) => {
    setView(next);
    setActiveImg(0);
  };

  const handleVote = () => {
    if (!user || animating) return;
    setAnimating(true);
    onVote?.(issue._id);
    setTimeout(() => setAnimating(false), 450);
  };

  return (
    <article className="card card-hover overflow-hidden">
      {/* Hero image */}
      <div className="relative h-56 w-full bg-surface-3">
        {photos.length > 0 ? (
          <img
            src={photos[activeImg]}
            alt={view === 'after' ? `${issue.title} after resolution` : issue.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-faint">
            <ImageOff size={22} aria-hidden="true" />
            <span className="text-xs">No photo</span>
          </div>
        )}

        {/* Tags overlay - top left */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
            {issue.category}
          </span>
          <span className={`rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm badge-${issue.status}`}>
            {issue.status}
          </span>
        </div>

        {/* Priority badge - top right */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          <span style={{ color }}>●</span>
          {issue.aiPriority}/10
        </div>

        {/* Before / After toggle - bottom left */}
        {hasAfterImages && (
          <div className="absolute bottom-3 left-3 flex gap-1">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); switchView('before'); }}
              aria-label="Show photo before resolution"
              className={`rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm transition-colors ${
                view === 'before' ? 'bg-accent text-white' : 'bg-black/55 text-white/80 hover:text-white'
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); switchView('after'); }}
              aria-label="Show photo after resolution"
              className={`rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm transition-colors ${
                view === 'after' ? 'bg-success text-white' : 'bg-black/55 text-white/80 hover:text-white'
              }`}
            >
              After
            </button>
          </div>
        )}

        {/* Carousel dots - bottom center */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.preventDefault(); setActiveImg(i); }}
                aria-label={`Show ${view} photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeImg ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/issues/${issue._id}`} className="group">
              <h3 className="font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                {issue.title}
              </h3>
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Avatar user={issue.author} size="xs" />
                <span>by {issue.author?.name || 'Anonymous'}</span>
              </span>
            </p>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {issue.description}
        </p>

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

          <Link
            to={`/issues/${issue._id}`}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
          >
            {issue.aiSuggestions?.length > 0 ? (
              <>
                <Sparkles size={12} aria-hidden="true" />
                View
              </>
            ) : (
              'View →'
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}