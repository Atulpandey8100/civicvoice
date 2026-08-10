import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, Bell, User, LogIn, LayoutDashboard, Info, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const tabs = user
    ? [
        { to: '/', label: 'Home', Icon: Home, end: true },
        { to: '/issues', label: 'Search', Icon: Search },
        { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
        { to: '/create', label: 'Report', Icon: PlusCircle },
        { to: '/notifications', label: 'Alerts', Icon: Bell },
        { to: '/profile', label: 'Profile', Icon: User },
      ]
    : [
        { to: '/', label: 'Home', Icon: Home, end: true },
        { to: '/about', label: 'About', Icon: Info },
        { to: '/help', label: 'Help', Icon: HelpCircle },
        { to: '/auth', label: 'Login', Icon: LogIn },
      ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-3 left-1/2 z-[1500] flex max-w-[94vw] -translate-x-1/2 items-center gap-1.5 overflow-x-auto rounded-full border border-line bg-surface/95 px-2 py-2 shadow-pop backdrop-blur-md md:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map(({ to, label, Icon, end }) => {
        const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            aria-label={label}
            className={`relative flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-200 ${
              isActive ? 'bg-accent text-white shadow-card' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
            }`}
          >
            <Icon size={17} aria-hidden="true" />
            {isActive && <span className="whitespace-nowrap">{label}</span>}
            {label === 'Alerts' && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}