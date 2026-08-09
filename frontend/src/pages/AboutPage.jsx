import { Link } from 'react-router-dom';
import { Info, Sparkles, MapPin, ThumbsUp, ShieldCheck, Users } from 'lucide-react';

const VALUES = [
  {
    icon: Users,
    title: 'Community-first',
    text: 'Residents raise what matters most, and votes decide what officials tackle first.'
  },
  {
    icon: Sparkles,
    title: 'AI-powered insight',
    text: 'Gemini AI scores urgency and proposes solutions the moment an issue is reported.'
  },
  {
    icon: ShieldCheck,
    title: 'Transparent & open',
    text: 'Every issue, status change, and vote is visible to the whole community.'
  }
];

const STEPS = [
  { icon: MapPin, text: 'Report an issue with photos and a pin on the map.' },
  { icon: ThumbsUp, text: 'The community votes on what should be fixed first.' },
  { icon: Sparkles, text: 'Officials update status until the issue is resolved.' }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        <Info size={14} aria-hidden="true" />
        About CivicVoice
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Stronger communities, one issue at a time.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
        CivicVoice is a community-driven platform that helps citizens report neighborhood problems,
        prioritize them together, and track progress until they are solved. By pairing civic
        participation with AI-assisted analysis, we make it easy to see what matters and push for real
        change.
      </p>

      <section className="mt-10" aria-label="What we stand for">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">What we stand for</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card card-hover p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon size={19} aria-hidden="true" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-label="How the platform works">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">How the platform works</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <li key={text} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="flex items-center gap-2 text-sm leading-relaxed text-ink-soft sm:text-base">
                <Icon size={16} className="shrink-0 text-accent" aria-hidden="true" />
                {text}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="card mt-10 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">Got an issue nearby?</h2>
          <p className="mt-1 text-sm text-ink-soft">See something broken? Report it in under two minutes.</p>
        </div>
        <Link to="/report" className="btn btn-primary shrink-0">Report an Issue</Link>
      </div>
    </div>
  );
}
