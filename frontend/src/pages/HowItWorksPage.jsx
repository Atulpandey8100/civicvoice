import { Link } from 'react-router-dom';
import { Lightbulb, MapPin, Sparkles, ThumbsUp, Search, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    icon: MapPin,
    step: 'Step 1',
    title: 'Report',
    text: 'Describe the problem, add photos, and drop a pin on the map. You can stay anonymous or add your name.'
  },
  {
    icon: Sparkles,
    step: 'Step 2',
    title: 'AI analysis',
    text: 'Gemini AI reads your report, scores its urgency from 1–10, and suggests practical solutions for officials.'
  },
  {
    icon: ThumbsUp,
    step: 'Step 3',
    title: 'Community votes',
    text: 'Neighbors vote on what matters most. High-priority, high-vote issues rise to the top of the list.'
  },
  {
    icon: Search,
    step: 'Step 4',
    title: 'Officials act',
    text: 'Officials see the ranked list, take up issues, and update status — keeping everyone informed.'
  },
  {
    icon: CheckCircle2,
    step: 'Step 5',
    title: 'Resolved',
    text: 'Once an issue is resolved, the community gets notified and the map reflects the fix.'
  }
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        <Lightbulb size={14} aria-hidden="true" />
        How It Works
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        From report to resolution in five steps.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-soft">
        CivicVoice turns a single citizen report into a community-wide effort that officials can act
        on. Here is how the journey works.
      </p>

      <ol className="relative mt-8 space-y-6">
        {STEPS.map(({ icon: Icon, step, title, text }, i) => (
          <li key={step} className="relative flex gap-4">
            {i < STEPS.length - 1 && (
              <span
                className="absolute left-[23px] top-12 h-[calc(100%-2rem)] w-px bg-line"
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Icon size={21} aria-hidden="true" />
            </span>
            <div className="card min-w-0 flex-1 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-accent">{step}</p>
              <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-ink">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="card mt-10 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">Ready to start?</h2>
          <p className="mt-1 text-sm text-ink-soft">The first step takes less than two minutes.</p>
        </div>
        <Link to="/report" className="btn btn-primary shrink-0">Report an Issue</Link>
      </div>
    </div>
  );
}
