import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, ArrowRight, ChevronRight, ImageOff } from 'lucide-react';
import LandingMap from '../components/LandingMap';
import api from '../utils/api';

const STATUS_LABELS = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
};

const STATUS_META = [
  { status: 'pending', label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400' },
  { status: 'in-progress', label: 'In Progress', color: 'text-sky-400', bg: 'bg-sky-400' },
  { status: 'resolved', label: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-400' },
  { status: 'closed', label: 'Closed', color: 'text-slate-400', bg: 'bg-slate-400' }
];

function IssueTeaserCard({ issue }) {
  const hasImages = issue.images?.length > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:border-sky-400/40 hover:bg-white/[0.07]">
      <Link to={`/issues/${issue._id}`} className="block">
        <div className="relative h-48 w-full bg-slate-800">
          {hasImages ? (
            <img
              src={issue.images[0]}
              alt={issue.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-500">
              <ImageOff size={22} aria-hidden="true" />
              <span className="text-xs">No photo</span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
              {issue.category}
            </span>
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
              {STATUS_LABELS[issue.status] || issue.status}
            </span>
          </div>

          <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            AI Priority: {issue.aiPriority}/10
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link
          to={`/issues/${issue._id}`}
          className="line-clamp-2 font-display text-lg font-semibold text-white transition-colors hover:text-sky-300"
        >
          {issue.title}
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-400">
          {issue.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">{issue.voteCount} votes</span>
          <Link
            to={`/issues/${issue._id}`}
            className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
          >
            View
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function IssueSection({ title, subtitle, issues, loading, viewMoreTo }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        <Link
          to={viewMoreTo}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-sky-400/50 hover:bg-white/10 hover:text-sky-300"
        >
          View More
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {issues.map((issue) => (
            <IssueTeaserCard key={issue._id} issue={issue} />
          ))}
        </div>
      )}
    </section>
  );
}

function IssueStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/issues/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const total = stats?.totalIssues ?? 0;
  const counts = {};
  for (const item of stats?.statusBreakdown || []) {
    counts[item._id] = item.count;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10">
        {!stats ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-6">
              <p className="text-sm font-medium uppercase tracking-wide text-sky-300">
                Total Registered
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-white">{total}</p>
            </div>

            {STATUS_META.map(({ status, label, color, bg }) => (
              <div key={status} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${bg}`} aria-hidden="true" />
                  <p className={`text-sm font-medium uppercase tracking-wide ${color}`}>{label}</p>
                </div>
                <p className="mt-2 font-display text-4xl font-bold text-white">
                  {counts[status] ?? 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [topIssues, setTopIssues] = useState([]);
  const [resolvedIssues, setResolvedIssues] = useState([]);
  const [topLoading, setTopLoading] = useState(true);
  const [resolvedLoading, setResolvedLoading] = useState(true);

  useEffect(() => {
    api
      .get('/issues', { params: { sort: '-aiPriority', limit: 3 } })
      .then(({ data }) => setTopIssues(data.issues || []))
      .catch(() => {})
      .finally(() => setTopLoading(false));

    api
      .get('/issues', { params: { status: 'resolved', sort: '-createdAt', limit: 3 } })
      .then(({ data }) => setResolvedIssues(data.issues || []))
      .catch(() => {})
      .finally(() => setResolvedLoading(false));
  }, []);

  return (
    <div className="bg-[#05081C] text-slate-300">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-300">
              <Sparkles size={13} aria-hidden="true" />
              Powered by Community &amp; AI
            </span>

            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Your Voice.
              <br />
              <span className="text-sky-400">Your Community.</span>
              <br />
              Your Impact.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              CivicVoice lets citizens report community issues, prioritize what matters, and
              collaborate with officials to build better neighborhoods — with AI-powered analysis
              and a live interactive map.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/report"
                className="btn bg-sky-500 text-white shadow-card hover:bg-sky-400 hover:shadow-[0_8px_24px_rgba(14,165,233,0.35)]"
              >
                <MapPin size={16} aria-hidden="true" />
                Report an Issue
              </Link>
              <Link
                to="/community"
                className="btn border border-white/15 bg-white/5 text-white transition-colors hover:border-sky-400/50 hover:bg-white/10 hover:text-sky-300"
              >
                Explore Issues
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:pl-2">
            <LandingMap />
          </div>
        </div>
      </section>

      <IssueStats />

      <IssueSection
        title="Major Issues"
        subtitle="The most urgent issues reported by the community, ranked by AI priority."
        issues={topIssues}
        loading={topLoading}
        viewMoreTo="/issues"
      />

      <IssueSection
        title="Resolved Issues"
        subtitle="Recent community issues that have been successfully resolved."
        issues={resolvedIssues}
        loading={resolvedLoading}
        viewMoreTo="/issues?status=resolved"
      />
    </div>
  );
}
