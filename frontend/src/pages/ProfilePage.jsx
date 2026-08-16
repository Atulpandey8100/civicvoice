import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Eye, KeyRound, X, Check, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { INDIAN_STATES, districtsOf } from '../data/india';

const ROLE_LABELS = { resident: 'Resident', official: 'Official', admin: 'Admin' };

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    mobile: user?.mobile || '',
    state: user?.address?.state || '',
    district: user?.address?.district || ''
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', otp: '', newPassword: '', confirmPassword: '' });
  const [changingPwd, setChangingPwd] = useState(false);
  const [sendingPwdOtp, setSendingPwdOtp] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMyIssues();
    api.get('/auth/me').then(({ data }) => {
      if (data.user) {
        updateUser(data.user);
        setForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          mobile: data.user.mobile || '',
          state: data.user.address?.state || '',
          district: data.user.address?.district || ''
        });
      }
      }).catch(() => {});
  }, [user?.id]);

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

  const startEdit = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      mobile: user?.mobile || '',
      state: user?.address?.state || '',
      district: user?.address?.district || ''
    });
    setEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/me', form);
      updateUser(data.user);
      setForm({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        mobile: data.user.mobile || '',
        state: data.user.address?.state || '',
        district: data.user.address?.district || ''
      });
      setEditing(false);
      toast({ variant: 'success', title: 'Profile updated' });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not update profile', description: err.response?.data?.error || 'Please try again.' });
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPwd(true);
    try {
      await api.put('/auth/password', pwdForm);
      setPwdForm({ currentPassword: '', otp: '', newPassword: '', confirmPassword: '' });
      setShowPwdForm(false);
      toast({ variant: 'success', title: 'Password changed', description: 'Your password has been updated.' });
    } catch (err) {
      toast({ variant: 'error', title: 'Password change failed', description: err.response?.data?.error || 'Please try again.' });
    }
    setChangingPwd(false);
  };

  const sendPasswordOtp = async () => {
    setSendingPwdOtp(true);
    try {
      await api.post('/auth/send-password-otp');
      toast({ variant: 'success', title: 'OTP sent', description: 'A 6-digit OTP was sent to your email.' });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not send OTP', description: err.response?.data?.error || 'Please try again.' });
    }
    setSendingPwdOtp(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/auth/avatar', formData);
      updateUser(data.user);
      toast({ variant: 'success', title: 'Profile photo updated' });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not update photo', description: err.response?.data?.error || 'Please try again.' });
    }
    setUploadingAvatar(false);
    e.target.value = '';
  };

  const handleAvatarRemove = async () => {
    try {
      const { data } = await api.delete('/auth/avatar');
      updateUser(data.user);
      toast({ variant: 'success', title: 'Profile photo removed' });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not remove photo', description: err.response?.data?.error || 'Please try again.' });
    }
  };

  if (!user) return null;

  const districts = editing ? districtsOf(form.state) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="card flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar user={user} size="lg" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change profile photo"
              title="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-soft shadow-card transition-colors hover:bg-surface-3 hover:text-ink disabled:opacity-60"
            >
              {uploadingAvatar ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-faint border-t-transparent" aria-hidden="true" />
              ) : (
                <Camera size={13} aria-hidden="true" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{user.name}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">{user.email}</p>
            <span className={`badge badge-${user.role === 'admin' ? 'in-progress' : user.role === 'official' ? 'resolved' : 'pending'} mt-2`}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {user.avatar && (
            <button className="btn btn-sm btn-secondary" onClick={handleAvatarRemove} disabled={uploadingAvatar}>
              <Trash2 size={13} aria-hidden="true" />
              Remove Photo
            </button>
          )}
          {!editing ? (
            <>
              <button className="btn btn-sm btn-secondary" onClick={startEdit}>
                <Pencil size={13} aria-hidden="true" />
                Edit Profile
              </button>
              <button className="btn btn-sm btn-secondary" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn btn-sm btn-primary" onClick={handleSaveProfile} disabled={saving}>
                <Check size={13} aria-hidden="true" />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
                <X size={13} aria-hidden="true" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card mt-5 p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Profile Details</h2>
        {editing ? (
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                id="mobile"
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-group">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value, district: '' })}
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.state} value={s.state}>{s.state}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="district">District</label>
                <select
                  id="district"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  disabled={!form.state}
                  required
                >
                  <option value="">{form.state ? 'Select District' : 'Select State first'}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Check size={15} aria-hidden="true" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">First Name</dt>
              <dd className="mt-0.5 text-sm text-ink">{user.firstName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Last Name</dt>
              <dd className="mt-0.5 text-sm text-ink">{user.lastName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Email</dt>
              <dd className="mt-0.5 text-sm text-ink">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Mobile</dt>
              <dd className="mt-0.5 text-sm text-ink">{user.mobile || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">State</dt>
              <dd className="mt-0.5 text-sm text-ink">{user.address?.state || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">District</dt>
              <dd className="mt-0.5 text-sm text-ink">{user.address?.district || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Member Since</dt>
              <dd className="mt-0.5 text-sm text-ink">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Role</dt>
              <dd className="mt-0.5 text-sm text-ink">{ROLE_LABELS[user.role] || user.role}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="card mt-5 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <KeyRound size={17} aria-hidden="true" />
          Change Password
        </h2>
        {!showPwdForm ? (
          <button type="button" className="btn btn-secondary mt-4" onClick={() => setShowPwdForm(true)}>
            <KeyRound size={15} aria-hidden="true" />
            Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pwdOtp">Email OTP</label>
              <div className="flex gap-2">
                <input
                  id="pwdOtp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={pwdForm.otp}
                  onChange={(e) => setPwdForm({ ...pwdForm, otp: e.target.value.replace(/\D/g, '') })}
                  placeholder="6-digit OTP sent to your email"
                  className="min-w-0 flex-1"
                  required
                />
                <button
                  type="button"
                  onClick={sendPasswordOtp}
                  disabled={sendingPwdOtp}
                  className="btn btn-secondary shrink-0 !px-3"
                >
                  {sendingPwdOtp ? 'Sending…' : 'Send OTP'}
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary" disabled={changingPwd}>
                <KeyRound size={15} aria-hidden="true" />
                {changingPwd ? 'Changing…' : 'Change Password'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPwdForm(false)} disabled={changingPwd}>
                Cancel
              </button>
            </div>
          </form>
        )}
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
                  <Link to={`/issues/${issue._id}`} className="btn btn-sm btn-secondary">
                    <Eye size={13} aria-hidden="true" />
                    View
                  </Link>
                  <Link to={`/issues/${issue._id}/edit`} className="btn btn-sm btn-secondary">
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </Link>
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
