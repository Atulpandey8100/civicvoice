import { Link, NavLink } from 'react-router-dom';
import { Landmark } from 'lucide-react';

const PLATFORM_LINKS = [
  { to: '/issues', label: 'Explore Issues' },
  { to: '/map', label: 'Community Map' }
];

const COMMUNITY_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/contact', label: 'Contact Us' }
];

const linkClass = ({ isActive }) =>
  `inline-flex items-center rounded-md text-sm text-slate-400 transition-colors duration-200 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
    isActive ? 'font-semibold text-sky-300' : ''
  }`;

function FooterColumn({ title, label, links }) {
  return (
    <nav aria-label={label} className="sm:min-w-0">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map(({ to, label: linkLabel }) => (
          <li key={to}>
            <NavLink to={to} end className={linkClass}>
              {linkLabel}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#05081C] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand + description */}
          <div className="max-w-sm">
            <Link
              to="/"
              aria-label="CivicVoice home"
              className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-card">
                <Landmark size={19} aria-hidden="true" />
              </span>
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                Civic<span className="text-sky-400">Voice</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              A community-driven platform that helps citizens raise issues, prioritize problems, and
              work together to build better communities.
            </p>
          </div>

          <FooterColumn title="Platform" label="Platform" links={PLATFORM_LINKS} />
          <FooterColumn title="Community" label="Community" links={COMMUNITY_LINKS} />
        </div>

        <hr className="my-8 border-slate-800" aria-hidden="true" />

        <p className="text-center text-sm text-slate-500">
          &copy; 2026 CivicVoice. Built for stronger communities.
        </p>
      </div>
    </footer>
  );
}
