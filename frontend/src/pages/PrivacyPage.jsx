import { ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information we collect',
    text: 'When you create an account we store your name, email address, and chosen role. When you report an issue, we store the title, description, category, uploaded photos, and the location you provide. Voting and commenting activity is linked to your account.'
  },
  {
    title: '2. How we use your data',
    text: 'Your data powers the CivicVoice experience: showing you nearby issues, ranking issues by community votes, notifying you of status changes, and enabling officials to respond. We may use non-personal issue text and metadata for AI analysis of priority and suggested solutions.'
  },
  {
    title: '3. AI analysis',
    text: 'Issue descriptions and optional location details may be sent to our AI provider to compute an urgency score and propose solutions. We do not send your account name or email as part of this analysis.'
  },
  {
    title: '4. What we share',
    text: 'Issue reports are public to the community — including your chosen display name and, if you set one, the reported location. We never sell your personal information. We only share data with service providers (such as hosting or AI analysis) necessary to operate the platform.'
  },
  {
    title: '5. Photos and locations',
    text: 'Photos you upload are shown publicly as part of your report. Location pins are approximate; you may prefer to describe your location in text instead of dropping an exact pin.'
  },
  {
    title: '6. Data retention',
    text: 'We keep your account and issue history while your account is active. You may request deletion of your account and associated data at any time by contacting us.'
  },
  {
    title: '7. Your rights',
    text: 'You can review and correct your profile, delete your own issues, or request full account deletion. You may also withdraw consent for AI analysis at any time by contacting us.'
  },
  {
    title: '8. Contact',
    text: 'Questions about privacy? Reach out through our contact page and we will respond within a few business days.'
  }
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        <ShieldCheck size={14} aria-hidden="true" />
        Privacy
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Privacy policy
      </h1>
      <p className="mt-3 text-sm text-ink-faint">Last updated: August 2026</p>
      <p className="mt-4 text-base leading-relaxed text-ink-soft">
        Your data matters to us. This policy explains what CivicVoice collects, why we collect it, and
        the choices you have.
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
