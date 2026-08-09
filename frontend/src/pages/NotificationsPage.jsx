import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      toast({ variant: 'error', title: 'Could not load notifications' });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchNotifications();
  }, [user, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast({ variant: 'error', title: 'Could not mark as read' });
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast({ variant: 'error', title: 'Could not mark as read' });
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const removed = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (removed && !removed.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast({ variant: 'error', title: 'Could not delete notification' });
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'status-change': return '\u{1F504}';
      case 'new-comment': return '\u{1F4AC}';
      case 'issue-resolved': return '\u{2705}';
      case 'vote': return '\u{1F44D}';
      default: return '\u{1F514}';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <LoadingSkeleton count={1} variant="card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Notifications {unreadCount > 0 && <span className="text-sm font-semibold text-danger">({unreadCount} unread)</span>}
        </h1>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-secondary" onClick={markAllRead}>Mark All Read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="When someone votes on or comments on your issues, you'll see it here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n._id}
              className={`card card-hover flex items-start justify-between gap-3 p-4 ${n.isRead ? 'opacity-70' : ''}`}
              style={n.isRead ? {} : { borderLeft: '3px solid var(--accent)' }}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="text-xl" aria-hidden="true">{getIcon(n.type)}</span>
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-ink">{n.message}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  {n.issue && (
                    <Link
                      to={`/issues/${n.issue._id}`}
                      onClick={() => !n.isRead && markRead(n._id)}
                      className="mt-1 inline-block text-xs font-semibold text-accent hover:underline"
                    >
                      View Issue
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!n.isRead && (
                  <button className="btn btn-sm btn-secondary" onClick={() => markRead(n._id)}>
                    Mark Read
                  </button>
                )}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteNotification(n._id)}
                  aria-label="Delete notification"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
