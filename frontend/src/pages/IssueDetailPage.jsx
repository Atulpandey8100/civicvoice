import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, MapPin, ThumbsUp, Sparkles, Trash2, Pencil, MessageSquare, ImagePlus, X, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PriorityBar from '../components/PriorityBar';
import StatusStepper from '../components/StatusStepper';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { useToast } from '../components/Toast';
import { priorityColor, priorityLabel } from '../utils/priority';

const priorityIcon = (priority) => {
  const color = priorityColor(priority);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:3px solid rgba(255,255,255,0.95);">${priority}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState('');
  const [voting, setVoting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusImages, setStatusImages] = useState([]);
  const [statusPreviews, setStatusPreviews] = useState([]);
  const [updating, setUpdating] = useState(false);
  const statusFileInputRef = useRef(null);
  const statusPreviewRefs = useRef(new Set());

  useEffect(() => {
    const urls = statusPreviewRefs.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/issues/${id}`)
      .then(({ data }) => setIssue(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async () => {
    if (!user || voting) return;
    setVoting(true);
    try {
      const { data } = await api.post(`/issues/${id}/vote`);
      setIssue(data);
    } catch (err) {
      toast({ variant: 'error', title: 'Vote failed', description: err.response?.data?.error || 'Please try again.' });
    }
    setVoting(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/issues/${id}/comments`, { text: comment });
      setIssue(data);
      setComment('');
    } catch (err) {
      toast({ variant: 'error', title: 'Comment failed', description: err.response?.data?.error || 'Please try again.' });
    }
  };

  const handleStatusChange = async (status) => {
    if (updating) return;
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', status);
      statusImages.forEach((img) => formData.append('images', img));
      const { data } = await api.put(`/issues/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setIssue(data);
      statusPreviews.forEach((url) => statusPreviewRefs.current.delete(url));
      setStatusImages([]);
      setStatusPreviews([]);
      toast({ variant: 'success', title: 'Status updated', description: `Issue is now ${status.replace('-', ' ')}.` });
    } catch (err) {
      toast({ variant: 'error', title: 'Update failed', description: err.response?.data?.error || 'Please try again.' });
    }
    setUpdating(false);
  };

  const handleStatusImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + statusImages.length > 5) {
      toast({ variant: 'error', title: 'Too many images', description: 'Maximum 5 photos allowed.' });
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    urls.forEach((u) => statusPreviewRefs.current.add(u));
    setStatusImages((prev) => [...prev, ...files]);
    setStatusPreviews((prev) => [...prev, ...urls]);
    e.target.value = '';
  };

  const removeStatusImage = (index) => {
    setStatusImages((prev) => prev.filter((_, i) => i !== index));
    setStatusPreviews((prev) => {
      const url = prev[index];
      if (url) {
        statusPreviewRefs.current.delete(url);
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post(`/issues/${id}/analyze`);
      setIssue(data);
      toast({ variant: 'success', title: 'AI solution generated', description: 'A precise practical solution has been recommended.' });
    } catch (err) {
      toast({ variant: 'error', title: 'AI analysis failed', description: err.response?.data?.error || 'Please try again later.' });
    }
    setAnalyzing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this issue? This cannot be undone.')) return;
    try {
      await api.delete(`/issues/${id}`);
      toast({ variant: 'success', title: 'Issue deleted' });
      navigate('/community');
    } catch (err) {
      toast({ variant: 'error', title: 'Delete failed', description: err.response?.data?.error || 'Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <LoadingSkeleton count={1} variant="card" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title="Issue not found"
          description="This issue may have been removed."
          action={{ to: '/', label: 'Back to Issues' }}
        />
      </div>
    );
  }

  const isOwner = user && issue.author?._id === user.id;
  const isOfficial = user && (user.role === 'official' || user.role === 'admin');
  const hasVoted = issue.votes?.includes(user?.id);
  const coordinates = issue.location?.coordinates;
  const hasCoords = Array.isArray(coordinates) && coordinates.length === 2 && coordinates[0] !== 0 && coordinates[1] !== 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/community" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent">
        <ArrowLeft size={14} aria-hidden="true" />
        Back to Issues
      </Link>

      <article className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-ink">{issue.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span className={`badge badge-${issue.status}`}>{issue.status}</span>
              <span className="rounded-full bg-surface-3 px-2.5 py-0.5 font-medium capitalize">{issue.category}</span>
              <span className="flex items-center gap-1">
                <Avatar user={issue.author} size="xs" />
                <span>by {issue.author?.name || 'Anonymous'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleVote}
              disabled={!user || voting}
              aria-label={hasVoted ? 'Remove your vote' : 'Vote for this issue'}
              aria-pressed={hasVoted}
              className={`vote-btn ${hasVoted ? 'voted' : ''}`}
            >
              <ThumbsUp size={15} fill={hasVoted ? 'currentColor' : 'none'} aria-hidden="true" />
              {issue.voteCount}
            </button>
            {(isOwner || isOfficial) && (
              <Link to={`/issues/${id}/edit`} aria-label="Edit issue" className="btn btn-sm btn-secondary">
                <Pencil size={13} aria-hidden="true" />
                Edit
              </Link>
            )}
            {(isOwner || user?.role === 'admin') && (
              <button type="button" aria-label="Delete issue" className="btn btn-sm btn-danger" onClick={handleDelete}>
                <Trash2 size={13} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink">{issue.description}</p>

        {issue.images?.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-ink-soft">Photos</p>
            <div className="flex flex-wrap gap-2">
              {issue.images.map((img, i) => (
                <a
                  key={i}
                  href={img}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open issue photo ${i + 1} in a new tab`}
                  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <img
                    src={img}
                    alt={`Issue photo ${i + 1}`}
                    loading="lazy"
                    className="h-28 w-28 cursor-zoom-in rounded-xl border border-line object-cover transition-transform hover:scale-[1.03]"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {issue.location?.address && (
          <p className="mt-5 flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin size={14} aria-hidden="true" />
            {issue.location.address}
          </p>
        )}

        {hasCoords && (
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <MapContainer
              center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
              zoom={15}
              style={{ height: '240px', width: '100%' }}
              scrollWheelZoom={false}
              className="z-0"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker
                position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                icon={priorityIcon(issue.aiPriority)}
              />
            </MapContainer>
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-line bg-accent-soft/60 p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            AI Analysis
          </h2>

          <div className="mt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-soft">Priority Score</span>
              <span className="text-sm font-bold" style={{ color: priorityColor(issue.aiPriority) }}>
                {issue.aiPriority}/10 · {priorityLabel(issue.aiPriority)}
              </span>
            </div>
            <PriorityBar score={issue.aiPriority} size="md" showLabel={false} />
          </div>

          {issue.aiSolution ? (
            <div className="mt-5">
              <p className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
                <Sparkles size={13} className="text-accent" aria-hidden="true" />
                AI Recommended Solution
              </p>
              <div className="rounded-xl border border-accent/30 bg-surface p-4">
                <p className="text-sm leading-relaxed text-ink">{issue.aiSolution}</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-line bg-surface p-4">
              <p className="text-sm text-ink-soft">
                No AI solution generated yet for this issue.
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="btn btn-primary btn-sm mt-3"
              >
                <Sparkles size={14} aria-hidden="true" />
                {analyzing ? 'Generating…' : 'Generate AI Solution'}
              </button>
            </div>
          )}

          {issue.aiSuggestions?.length > 0 && (
            <div className="mt-5">
              <p className="mb-2.5 text-sm font-semibold text-ink-soft">Quick Actions</p>
              <div className="space-y-2.5">
                {issue.aiSuggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-ink">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {issue.statusUpdates?.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
              <History size={16} className="text-accent" aria-hidden="true" />
              Status Updates
            </h2>
            <ol className="space-y-4 border-l-2 border-line pl-5">
              {issue.statusUpdates.map((u, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-accent"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge badge-${u.status}`}>{u.status}</span>
                    <span className="text-sm text-ink-soft">{u.user?.name || 'Official'}</span>
                    <span className="text-xs text-ink-faint">{new Date(u.createdAt).toLocaleString()}</span>
                  </div>
                  {u.images?.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {u.images.map((img, j) => (
                        <a
                          key={j}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open after photo ${j + 1} for ${u.status} update in a new tab`}
                          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                          <img
                            src={img}
                            alt={`After photo ${j + 1} for ${u.status} update`}
                            loading="lazy"
                            className="h-24 w-24 cursor-zoom-in rounded-xl border border-line object-cover transition-transform hover:scale-[1.03]"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {isOfficial && (
          <section className="mt-6 rounded-2xl border border-line bg-surface-2 p-5">
            <h2 className="mb-3 font-display text-base font-semibold text-ink">Update Status</h2>
            <StatusStepper status={issue.status} onSelect={handleStatusChange} disabled={updating} />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => statusFileInputRef.current?.click()}
                className="btn btn-sm btn-secondary"
                aria-label="Attach photos showing the change"
              >
                <ImagePlus size={14} aria-hidden="true" />
                {statusPreviews.length > 0 ? 'Add more photos' : 'Attach photos'}
              </button>
              <input
                ref={statusFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleStatusImages}
                className="hidden"
              />
              {statusPreviews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`Attached status photo ${i + 1}`} className="h-16 w-16 rounded-lg border border-line object-cover" />
                  <button
                    type="button"
                    onClick={() => removeStatusImage(i)}
                    aria-label={`Remove attached photo ${i + 1}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-card transition-transform hover:scale-110"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {statusPreviews.length > 0 && (
                <p className="w-full text-xs text-ink-faint">
                  Photos attach to the next status change to show the before/after difference.
                </p>
              )}
            </div>
          </section>
        )}

        <hr className="my-7 border-t border-line" />

        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <MessageSquare size={16} aria-hidden="true" />
          Comments ({issue.comments?.length || 0})
        </h2>

        <div className="mt-4 space-y-3">
          {issue.comments?.length > 0 ? (
            issue.comments.map((c, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface-2 p-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Avatar user={c.user} size="xs" />
                    {c.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-ink-faint">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm leading-relaxed text-ink-soft">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="py-2 text-sm text-ink-soft">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>

        {user ? (
          <form onSubmit={handleComment} className="mt-5 flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              aria-label="Comment text"
              className="input"
            />
            <button type="submit" className="btn btn-primary shrink-0">Post</button>
          </form>
        ) : (
          <p className="mt-5 text-sm text-ink-soft">
            <Link to="/auth" className="font-semibold text-accent hover:underline">Log in</Link> to vote or comment.
          </p>
        )}
      </article>
    </div>
  );
}
