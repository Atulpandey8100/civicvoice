import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, AlertCircle, ArrowLeft, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/Toast';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const toast = useToast();

  const handleSendOtp = async (e, resend = false) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    resend ? setResending(true) : setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setInfo(resend ? 'A new OTP has been sent.' : data.message || 'OTP sent to your email.');
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
    setResending(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/verify-otp', { email: email.trim(), otp });
      setInfo('OTP verified. Set your new password below.');
      setStep('newPassword');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number and a special character');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp,
        password,
        confirmPassword
      });
      toast({ variant: 'success', title: 'Password updated', description: 'You can now log in with your new password.' });
      setInfo(data.message || 'Password updated. You can now log in.');
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const StepIcon = step === 'email' ? MailCheck : step === 'otp' ? KeyRound : step === 'newPassword' ? ShieldCheck : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-card">
            {StepIcon && <StepIcon size={24} aria-hidden="true" />}
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Reset your <span className="text-accent">Password</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {step === 'email' && 'Enter your registered email and we will send you a one-time password (OTP).'}
            {step === 'otp' && `An OTP was sent to ${email}. Enter it below to continue.`}
            {step === 'newPassword' && 'Choose a new password for your account.'}
            {step === 'done' && 'All done — you can sign in with your new password.'}
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {info && (
            <div role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-ink-soft">
              <MailCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {info}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="form-group">
                <label htmlFor="otp">OTP</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button
                type="button"
                className="btn btn-secondary w-full"
                disabled={resending}
                onClick={(e) => handleSendOtp(e, true)}
              >
                {resending ? 'Resending…' : 'Resend OTP'}
              </button>
            </form>
          )}

          {step === 'newPassword' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters with upper, lower, number & symbol"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <Link to="/auth" className="btn btn-primary w-full">Go to Login</Link>
            </div>
          )}
        </div>

        <Link to="/auth" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
