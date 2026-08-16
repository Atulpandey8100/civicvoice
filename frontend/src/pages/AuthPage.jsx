import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES, districtsOf } from '../data/india';
import SplashScreen from '../components/SplashScreen';
import Logo from '../components/Logo';
import api from '../utils/api';

const EMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  otp: '',
  password: '',
  confirmPassword: '',
  state: '',
  district: '',
  consent: false
};

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 flex items-start gap-1 text-xs font-medium text-danger"><AlertCircle size={13} className="mt-px shrink-0" aria-hidden="true" />{message}</p>;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [splash, setSplash] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value, ...(field === 'state' ? { district: '' } : {}) }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    else if (form.firstName.trim().length < 2) next.firstName = 'First name must be at least 2 characters';

    if (!form.lastName.trim()) next.lastName = 'Last name is required';

    if (!form.mobile) next.mobile = 'Mobile number is required';
    else if (!MOBILE_REGEX.test(form.mobile)) next.mobile = 'Enter a valid 10-digit mobile number';

    if (!form.email) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    else if (!EMAIL_REGEX.test(form.email)) next.email = 'Email must end with @gmail.com';

    if (!form.password) next.password = 'Password is required';
    else if (!PASSWORD_REGEX.test(form.password)) next.password = 'Password must be at least 8 characters and include uppercase, lowercase, number and a special character';

    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';

    if (!form.otp) next.otp = 'Enter the OTP sent to your email';
    else if (!/^\d{6}$/.test(form.otp)) next.otp = 'Enter the 6-digit OTP';

    if (!form.state) next.state = 'Please select your state';
    if (!form.district) next.district = 'Please select your district';

    if (!form.consent) next.consent = 'You must accept the consent before registering';
    return next;
  };

  const sendOtp = async () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    else if (!EMAIL_REGEX.test(form.email)) next.email = 'Email must end with @gmail.com';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setError('Please fix the highlighted fields before requesting an OTP.');
      return;
    }
    setError('');
    setInfo('');
    setSendingOtp(true);
    try {
      await api.post('/auth/send-register-otp', { email: form.email.trim() });
      setOtpSent(true);
      setInfo('OTP sent to your email. Enter it below to create your account.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP. Please try again.');
    }
    setSendingOtp(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLogin) {
      const next = validate();
      setErrors(next);
      if (Object.keys(next).length > 0) return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim(),
          otp: form.otp.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          state: form.state,
          district: form.district,
          consent: form.consent
        });
      }
      setSplash(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSwitch = (mode) => {
    setIsLogin(mode);
    setError('');
    setErrors({});
    setInfo('');
    setOtpSent(false);
  };

  const districts = form.state ? districtsOf(form.state) : [];

  return (
    <>
      {splash && <SplashScreen />}
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 block w-14">
            <Logo size={56} />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Welcome to Civic<span className="text-accent">Voice</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {isLogin ? 'Sign in to continue to your community.' : 'Create an account to start reporting issues.'}
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`tab ${isLogin ? 'active' : ''}`}
                onClick={() => handleSwitch(true)}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                className={`tab ${!isLogin ? 'active' : ''}`}
                onClick={() => handleSwitch(false)}
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <>
                <div className="grid">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={form.firstName}
                      onChange={setField('firstName')}
                      placeholder="Jane"
                      autoComplete="given-name"
                    />
                    <FieldError message={errors.firstName} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={form.lastName}
                      onChange={setField('lastName')}
                      placeholder="Doe"
                      autoComplete="family-name"
                    />
                    <FieldError message={errors.lastName} />
                  </div>
                </div>

                <div className="grid">
                  <div className="form-group">
                    <label htmlFor="mobile">Mobile Number</label>
                    <input
                      id="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.mobile}
                      onChange={setField('mobile')}
                      placeholder="9876543210"
                      autoComplete="tel-national"
                    />
                    <FieldError message={errors.mobile} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="flex gap-2">
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={setField('email')}
                        placeholder="you@gmail.com"
                        className="min-w-0 flex-1"
                      />
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={sendingOtp || otpSent}
                        className="btn btn-secondary shrink-0 !px-3"
                      >
                        {sendingOtp ? 'Sending…' : otpSent ? 'OTP Sent' : 'Send OTP'}
                      </button>
                    </div>
                    <FieldError message={errors.email} />
                  </div>
                </div>

                {otpSent && (
                  <p role="status" className="flex items-start gap-1.5 rounded-xl bg-accent-soft px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
                    <MailCheck size={13} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                    An OTP was sent to <strong className="text-ink">{form.email}</strong>. Enter it below to verify your email.
                  </p>
                )}

                <div className="form-group">
                  <label htmlFor="otp">Email OTP</label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={form.otp}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }));
                      setErrors((prev) => ({ ...prev, otp: undefined }));
                    }}
                    placeholder="6-digit OTP"
                  />
                  <FieldError message={errors.otp} />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={setField('password')}
                    placeholder="Min 8 characters with upper, lower, number & symbol"
                  />
                  <FieldError message={errors.password} />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={setField('confirmPassword')}
                    placeholder="Re-enter your password"
                  />
                  <FieldError message={errors.confirmPassword} />
                </div>

                <div className="grid">
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <select id="state" value={form.state} onChange={setField('state')}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s.state} value={s.state}>{s.state}</option>
                      ))}
                    </select>
                    <FieldError message={errors.state} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="district">District</label>
                    <select id="district" value={form.district} onChange={setField('district')} disabled={!form.state}>
                      <option value="">{form.state ? 'Select District' : 'Select State first'}</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <FieldError message={errors.district} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="flex items-start gap-2.5 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-ink-soft cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={setField('consent')}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                    />
                    <span>
                      I agree that the details provided are correct and I consent to CivicVoice storing my information
                      to manage my reported issues.
                    </span>
                  </label>
                  <FieldError message={errors.consent} />
                </div>

                <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
                  New accounts are registered as <strong className="text-accent">Residents</strong>. Government
                  Official accounts are assigned by an administrator.
                </p>
              </>
            )}

            {isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="you@gmail.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="mb-0">Password</label>
                    <Link to="/forgot-password" className="mb-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-hover">
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={setField('password')}
                    placeholder="Your password"
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to home
        </Link>
      </div>
      </div>
    </>
  );
}
