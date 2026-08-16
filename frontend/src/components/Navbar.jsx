import { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, Menu, X, Sun, Moon, Monitor, LogOut, User, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import Avatar from './Avatar';
import Logo from './Logo';

function useClickOutside(onOutside) {
  const ref = useRef(null);
  const handlerRef = useRef(onOutside);
  useEffect(() => {
    handlerRef.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);
  return ref;
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor }
];

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Switch theme. Current theme: ${resolvedTheme}. Press to choose light, dark or system.`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
      >
        <CurrentIcon size={17} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" aria-label="Theme options" className="absolute right-0 top-11 z-50 w-40 animate-pop-in overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-pop">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => { setTheme(value); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-accent-soft font-semibold text-accent' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Account menu for ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-xl border border-line bg-surface-2 px-1.5 transition-colors hover:border-line-strong"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden max-w-28 truncate text-sm font-medium text-ink md:block">{user.name}</span>
        <ChevronDown size={14} className="text-ink-faint" aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 top-11 z-50 w-56 animate-pop-in overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-pop">
          <div className="border-b border-line px-3.5 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-soft">{user.email}</p>
            <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              user.role === 'admin' ? 'badge-in-progress' : user.role === 'official' ? 'badge-resolved' : 'badge-pending'
            }`}>
              {user.role}
            </span>
          </div>
          <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink">
            <User size={15} aria-hidden="true" /> My Profile
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink">
              <ShieldCheck size={15} aria-hidden="true" /> Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); logout(); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
          >
            <LogOut size={15} aria-hidden="true" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const linkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
    }`;

  return (
    <>
      <header className="sticky top-0 z-[1500] border-b border-line bg-surface/85 backdrop-blur-md md:hidden">
        <nav className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6" aria-label="Mobile brand">
          <Link to="/" className="flex items-center gap-2.5" aria-label="CivicVoice home">
            <Logo size={36} />
            <span className="font-display text-base font-bold tracking-tight text-ink">
              Civic<span className="text-accent">Voice</span>
            </span>
          </Link>
        </nav>
      </header>
      <header className="sticky top-0 z-[1500] hidden border-b border-line bg-surface/85 backdrop-blur-md md:block">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2.5" aria-label="CivicVoice home">
          <Logo size={42} />
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Civic<span className="text-accent">Voice</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass} end>Home</NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          )}
          <NavLink to="/about" className={linkClass}>About Us</NavLink>
          <NavLink to="/help" className={linkClass}>Help</NavLink>
          <NavLink to="/report" className={linkClass}>Report an Issue</NavLink>
          {user && (
            <NavLink to="/notifications" className={linkClass}>
                <span className="flex items-center gap-1.5">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
              </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/auth" className="btn btn-primary hidden sm:inline-flex">
              Get Started
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-soft md:hidden"
          >
            {mobileOpen ? <X size={17} aria-hidden="true" /> : <Menu size={17} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-nav" className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" onClick={() => setMobileOpen(false)} className={linkClass} end>Home</NavLink>
            {user && (
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={linkClass}>Dashboard</NavLink>
            )}
            <NavLink to="/about" onClick={() => setMobileOpen(false)} className={linkClass}>About Us</NavLink>
            <NavLink to="/help" onClick={() => setMobileOpen(false)} className={linkClass}>Help</NavLink>
            <NavLink to="/report" onClick={() => setMobileOpen(false)} className={linkClass}>Report an Issue</NavLink>
            {user && (
              <>
                <NavLink to="/notifications" onClick={() => setMobileOpen(false)} className={linkClass}>
                  <span className="flex items-center gap-1.5">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                </NavLink>
                <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={linkClass}>My Profile</NavLink>
              </>
            )}
            {!user && (
              <NavLink to="/auth" onClick={() => setMobileOpen(false)} className={linkClass}>Login / Sign up</NavLink>
            )}
            {user && (
              <button
                type="button"
                onClick={() => { setMobileOpen(false); logout(); }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
              >
                <LogOut size={15} aria-hidden="true" /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}