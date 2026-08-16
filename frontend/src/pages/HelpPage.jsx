import { Link } from 'react-router-dom';
import { LifeBuoy, HelpCircle, MapPin, UserRound, ShieldCheck, MessageCircle } from 'lucide-react';
import Chatbot from '../components/Chatbot';

const FAQS = [
  {
    icon: MapPin,
    q: 'How do I report an issue?',
    a: 'Click "Report an Issue" in the navigation, sign in, describe the problem, add photos if you can, and drop a pin on the map. Gemini AI then scores its urgency and suggests solutions.'
  },
  {
    icon: UserRound,
    q: 'Do I need an account to report?',
    a: 'Yes. You need to sign in or register to report an issue so you can track updates, vote, and get notified when officials respond.'
  },
  {
    icon: ShieldCheck,
    q: 'Can I report anonymously?',
    a: 'You can choose to keep your name hidden on the public report. Your account is still needed so you can follow and manage your issue.'
  },
  {
    icon: MessageCircle,
    q: 'How do officials get involved?',
    a: 'Verified officials see a ranked list of issues by community votes and urgency, take up issues, and update their status — the community is notified at every step.'
  }
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        <LifeBuoy size={14} aria-hidden="true" />
        Help Center
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        How can we help?
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-soft">
        Quick answers to common questions about reporting, tracking, and resolving issues on
        CivicVoice.
      </p>

      <div className="mt-8 space-y-4">
        {FAQS.map(({ icon: Icon, q, a }) => (
          <details key={q} className="group card overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="flex-1 font-display text-base font-bold tracking-tight text-ink">
                {q}
              </span>
              <span className="text-ink-faint transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
                <HelpCircle size={18} />
              </span>
            </summary>
            <p className="px-5 pb-5 pl-[4.75rem] text-sm leading-relaxed text-ink-soft">{a}</p>
          </details>
        ))}
      </div>

      <Chatbot />

      <div className="card mt-10 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">Still stuck?</h2>
          <p className="mt-1 text-sm text-ink-soft">Reach out — our team usually replies within a day.</p>
        </div>
        <Link to="/contact" className="btn btn-primary shrink-0">Contact Us</Link>
      </div>
    </div>
  );
}
