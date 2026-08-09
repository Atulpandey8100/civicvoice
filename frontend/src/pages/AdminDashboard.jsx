import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast({ variant: 'error', title: 'Could not load admin data' });
    }
    setLoading(false);
  };

  const changeRole = async (userId, role) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u._id === userId ? data : u));
      toast({ variant: 'success', title: 'Role updated' });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not change role', description: err.response?.data?.error || 'Please try again.' });
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This will delete all their issues too.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast({ variant: 'success', title: 'User deleted' });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not delete user', description: err.response?.data?.error || 'Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <LoadingSkeleton count={1} variant="card" />
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-ink-soft sm:px-6">
        Failed to load admin data.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-ink">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="stat-card"><h3 className="text-accent">{stats.totalIssues}</h3><p>Total Issues</p></div>
        <div className="stat-card"><h3 className="text-warning">{stats.pendingIssues}</h3><p>Pending</p></div>
        <div className="stat-card"><h3 className="text-info">{stats.inProgressIssues}</h3><p>In Progress</p></div>
        <div className="stat-card"><h3 className="text-success">{stats.resolvedIssues}</h3><p>Resolved</p></div>
        <div className="stat-card"><h3 className="text-ink-soft">{stats.closedIssues}</h3><p>Closed</p></div>
        <div className="stat-card"><h3 className="text-accent">{stats.totalUsers}</h3><p>Total Users</p></div>
      </div>

      <div className="tabs mt-6">
        <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>Analytics</button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Manage Users</button>
      </div>

      {activeTab === 'stats' && (
        <div className="mt-5 space-y-4">
          <div className="card p-6">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">Issues by Category</h2>
            {stats.categoryStats.length > 0 ? (
              <div className="flex flex-col gap-3">
                {stats.categoryStats.map(cat => (
                  <div key={cat._id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm capitalize text-ink-soft">{cat._id}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded-md bg-line">
                      <div
                        className="h-full rounded-md bg-accent"
                        style={{
                          width: stats.totalIssues > 0 ? `${Math.max(4, (cat.count / stats.totalIssues) * 100)}%` : '0%'
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink">{cat.count}</span>
                    <span className="hidden shrink-0 text-xs text-ink-soft sm:block">
                      Avg Priority: {cat.avgPriority != null ? cat.avgPriority.toFixed(1) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">No data yet.</p>
            )}
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">Recent Issues</h2>
            {stats.recentIssues.length > 0 ? stats.recentIssues.map(issue => (
              <div key={issue._id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{issue.title}</p>
                  <p className="text-xs text-ink-soft">
                    by {issue.author?.name} · {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge badge-${issue.status}`}>{issue.status}</span>
              </div>
            )) : (
              <p className="text-sm text-ink-soft">No issues yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card mt-5 overflow-x-auto p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">All Users ({users.length})</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-2 py-2.5">Name</th>
                <th className="px-2 py-2.5">Email</th>
                <th className="px-2 py-2.5">Role</th>
                <th className="px-2 py-2.5">Joined</th>
                <th className="px-2 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-line last:border-b-0">
                  <td className="px-2 py-2.5 font-medium text-ink">{u.name}</td>
                  <td className="px-2 py-2.5 text-ink-soft">{u.email}</td>
                  <td className="px-2 py-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      aria-label={`Role for ${u.name}`}
                      className="input cursor-pointer"
                    >
                      <option value="resident">Resident</option>
                      <option value="official">Official</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-2 py-2.5 text-ink-soft">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2.5">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteUser(u._id)}
                      disabled={u._id === user?.id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
