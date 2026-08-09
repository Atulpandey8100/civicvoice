import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMyIssues();
  }, [user]);

  const fetchMyIssues = async () => {
    try {
      const { data } = await api.get('/issues/my');
      setMyIssues(data);
    } catch (err) {
      toast({ variant: 'error', title: 'Could not load your issues' });
    }
    setLoading(false);
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await api.delete(`/issues/${issueId}`);
      setMyIssues(prev => prev.filter(i => i._id !== issueId));
      toast({ variant: 'success', title: 'Issue deleted' });
    } catch (err) {
      toast({ variant: 'error', title: 'Delete failed', description: err.response?.data?.error || 'Please try again.' });
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="card flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{user.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
          <span className={`badge badge-${user.role === 'admin' ? 'in-progress' : user.role === 'official' ? 'resolved' : 'pending'} mt-2`}>
            {user.role}
          </span>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={logout}>Logout</button>
      </div>

      <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">My Issues ({myIssues.length})</h2>
        <Link to="/create" className="btn btn-primary btn-sm">
          <Plus size={14} aria-hidden="true" />
          Report New Issue
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} variant="card" />
      ) : myIssues.length === 0 ? (
        <EmptyState
          title="No issues reported yet"
          description="Report your first community issue and track its progress here."
          action={{ to: '/create', label: 'Report an Issue' }}
        />
      ) : (
        <div className="space-y-3">
          {myIssues.map(issue => (
            <div key={issue._id} className="card card-hover p-5">
              <div className="issue-header">
                <div>
                  <Link to={`/issues/${issue._id}`} className="font-display text-base font-semibold text-ink hover:text-accent">
                    {issue.title}
                  </Link>
                  <div className="issue-meta">
                    <span className={`badge badge-${issue.status}`}>{issue.status}</span>
                    <span>{issue.category}</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/issues/${issue._id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(issue._id)}>Delete</button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                {issue.description}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-ink-soft">
                <span>Votes: {issue.voteCount}</span>
                <span>AI Priority: {issue.aiPriority}/10</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
