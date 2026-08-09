import { Link } from 'react-router-dom';
import { Sparkles, MapPin, ArrowRight } from 'lucide-react';
import LandingMap from '../components/LandingMap';

export default function LandingPage() {
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
    </div>
  );
}
