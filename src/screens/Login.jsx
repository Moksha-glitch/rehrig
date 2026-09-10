import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import RehrigLogo from '../components/RehrigLogo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useDemoUsers } from '../hooks/useDemoUsers.js';
import { getErrorMessage } from '../lib/errors.js';
const PERSONA_TABS = [
  { key: 'rehrig', label: 'Rehrig' },
  { key: 'sp', label: 'Provider' },
  { key: 'customer', label: 'Customer' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(username, password) {
  const next = {};
  const trimmed = username.trim();
  if (!trimmed) next.username = 'Enter your username.';
  else if (!EMAIL_RE.test(trimmed)) next.username = 'Use your work email as your username.';
  if (!password) next.password = 'Enter your password.';
  return next;
}

export default function Login() {
  const { login, rememberDefault } = useAuth();
  const { state, setTheme } = useStore();
  const usernameId = useId();
  const passwordId = useId();
  const formErrorId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const formDomId = 'login-form';

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const formErrorRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoTab, setDemoTab] = useState('rehrig');
  const demoPanelId = useId();
  const tablistId = useId();

  const demoUsersQuery = useDemoUsers();
  const allDemoUsers = demoUsersQuery.data || [];
  const demoUsers = allDemoUsers.filter((user) => user.persona === demoTab);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (formError) formErrorRef.current?.focus();
  }, [formError]);

  const clearErrors = () => {
    setFormError('');
    setFieldErrors({});
  };

  const finishLogin = async (loginEmail, loginPassword) => {
    setFormError('');
    setBusy(true);
    try {
      await login(loginEmail, loginPassword, { remember: rememberDefault });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to sign in. Check your username and password.'));
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (event) => {
    event.preventDefault();
    const next = validateFields(username, password);
    setFieldErrors(next);
    setFormError('');

    if (next.username) {
      usernameRef.current?.focus();
      return;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    await finishLogin(username.trim().toLowerCase(), password);
  };

  const useDemoUser = (user) => {
    if (!user.active) {
      setFormError('This account is inactive and cannot sign in.');
      return;
    }
    setUsername(user.email);
    setPassword('vision');
    setFieldErrors({});
    finishLogin(user.email, 'vision');
  };

  const startSso = () => {
    setFieldErrors({});
    setFormError(
      'Single sign-on must be enabled for your organization. Contact your administrator to request access.'
    );
  };

  return (
    <main
      className="box-border flex min-h-screen w-full flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden"
      style={{ background: 'var(--color-brand)' }}
    >

      {/* Absolute Logo */}
      <div className="absolute top-6 left-6 lg:top-12 lg:left-12 z-10">
        <RehrigLogo className="w-32 lg:w-48 brightness-0 invert" />
      </div>

      <a href={`#${formDomId}`} className="skip-link">
        Skip to sign in
      </a>

      {/* Centered Content Wrapper */}
      <div className="relative z-10 flex w-full max-w-[62rem] flex-col items-center justify-center gap-12 lg:flex-row lg:items-center lg:justify-between mt-12 lg:mt-0">

        {/* Left Title Section */}
        <section className="flex flex-col text-center lg:text-left w-full lg:w-auto">
          <div className="mb-4 inline-flex items-center gap-2 justify-center lg:justify-start">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/70 border border-white/10">Rehrig Pacific Company</span>
          </div>
          <h1 className="font-display text-4xl lg:text-[4.5rem] font-bold tracking-tight mb-5 text-white leading-[1.05]">
            Secure<br />Partner<br /><span className="text-[#CADCFC]">Gateway</span>
          </h1>
          <p className="text-sm lg:text-base leading-relaxed text-white/60 max-w-sm">
            Your operational companion designed to scale your service partner operations safely, efficiently, and beautifully.
          </p>
          <div className="mt-8 hidden lg:flex items-center gap-6">
            {['Real-time tracking', 'Partner analytics', 'Secure access'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-white/50 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {f}
              </div>
            ))}
          </div>
        </section>

        {/* Right Login Card */}
        <section
          className="w-full max-w-[26rem] shrink-0 rounded-2xl overflow-hidden"
          style={{
            background:'rgba(255,255,255,0.96)',
            backdropFilter:'blur(20px)',
            boxShadow:'0 25px 60px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.8) inset',
            border:'1px solid rgba(255,255,255,0.5)',
          }}
        >
          <div
            className="px-3 py-2 text-center text-[11px] font-semibold text-white"
            style={{ background: 'var(--color-brand)' }}
          >
            Vision Operations Platform
          </div>
          <div className="px-8 py-9 lg:px-10 lg:py-10">
            {/* Logo / Brand */}
            <div className="mb-8 flex items-center gap-2.5 text-brand">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                style={{ background: 'var(--color-brand)', boxShadow: '0 2px 8px rgba(12,68,128,0.3)' }}
              >
                <Icon name="star" size={14} className="fill-current" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-ink">VisionPulse</span>
            </div>

            <div className="mb-7">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                Welcome back
              </p>
              <h2 id="signin-heading" className="font-display text-2xl font-bold tracking-tight text-ink">
                Sign in to your account
              </h2>
            </div>

            <form
              id={formDomId}
              onSubmit={signIn}
              className="space-y-4"
              noValidate
              aria-busy={busy}
            >
              <div>
                <label htmlFor={usernameId} className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Work Email <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Icon
                    name="mail"
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                    aria-hidden="true"
                  />
                  <input
                    ref={usernameRef}
                    id={usernameId}
                    type="email"
                    name="username"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      if (fieldErrors.username || formError) clearErrors();
                    }}
                    className={`login-field login-field-icon text-sm ${
                      fieldErrors.username ? 'login-field-error' : ''
                    }`}
                    placeholder="you@company.com"
                    required
                    disabled={busy}
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                  />
                </div>
                {fieldErrors.username && (
                  <p id={usernameErrorId} className="mt-1.5 text-xs text-danger" role="alert">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor={passwordId} className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    Password <span className="text-danger">*</span>
                  </label>
                  <button type="button" className="text-xs font-semibold text-accent hover:underline">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Icon
                    name="lock"
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                    aria-hidden="true"
                  />
                  <input
                    ref={passwordRef}
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (fieldErrors.password || formError) clearErrors();
                    }}
                    className={`login-field login-field-icon login-field-password text-sm ${
                      fieldErrors.password ? 'login-field-error' : ''
                    }`}
                    placeholder="Your secure password"
                    required
                    disabled={busy}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint interactive hover:text-ink-soft"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    disabled={busy}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={14} aria-hidden="true" />
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id={passwordErrorId} className="mt-1.5 text-xs text-danger" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div
                ref={formErrorRef}
                id={formErrorId}
                tabIndex={formError ? -1 : undefined}
                role="alert"
                aria-live="assertive"
                className={
                  formError
                    ? 'flex gap-2 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger outline-none'
                    : 'sr-only'
                }
              >
                {formError && (
                  <>
                    <Icon name="alert" size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="mt-2 flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{
                  background: 'var(--color-brand)',
                  boxShadow: '0 4px 16px rgba(12,68,128,0.4)',
                }}
              >
                {busy ? (
                  <>
                    <span
                      className="loading-spinner border-white/30 border-t-white"
                      aria-hidden="true"
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <Icon name="arrowRight" size={15} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="flex-1 h-px bg-line" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">or</span>
              <span className="flex-1 h-px bg-line" />
            </div>

            <button
              type="button"
              onClick={startSso}
              disabled={busy}
              className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border border-line bg-canvas text-sm font-semibold text-ink-soft transition-all hover:border-line-strong hover:bg-elevated hover:text-ink disabled:opacity-50"
            >
              <Icon name="shield" size={15} className="text-accent" aria-hidden="true" />
              Continue with Rehrig SSO
            </button>

            {/* Hidden demo accounts toggle for development */}
            <div className="mt-7 pt-4 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setDemoOpen((open) => !open)}
                className="text-[11px] text-ink-faint hover:text-ink-muted focus:outline-none"
              >
                Sample accounts
              </button>
            </div>

            {demoOpen && (
                <div
                  id={demoPanelId}
                  className="mt-2 animate-fade-in text-center"
                  role="region"
                  aria-label="Sample roles"
                >
                  <div
                    id={tablistId}
                    className="mb-2 flex justify-center gap-1"
                    role="tablist"
                    aria-label="Sample role"
                  >
                    {PERSONA_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={demoTab === tab.key}
                        onClick={() => setDemoTab(tab.key)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium interactive ${
                          demoTab === tab.key
                            ? 'bg-brand-soft text-brand'
                            : 'text-ink-faint hover:text-ink-muted'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <ul className="max-h-40 space-y-0.5 overflow-y-auto scroll-thin" role="list">
                    {demoUsers.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          disabled={!user.active || busy}
                          onClick={() => useDemoUser(user)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left interactive hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Sign in as ${user.name}, ${user.role}${
                            user.active ? '' : ', inactive'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium text-ink-soft">
                              {user.name}
                            </span>
                            <span className="block truncate text-[10px] text-ink-faint">
                              {user.role}
                              {!user.active ? ' · Inactive' : ''}
                            </span>
                          </span>
                          <Icon name="arrowRight" size={12} className="shrink-0 text-ink-faint" />
                        </button>
                      </li>
                    ))}
                    {!demoUsers.length && !demoUsersQuery.isLoading && (
                      <li className="px-2 py-3 text-[11px] text-ink-faint">No accounts in this persona.</li>
                    )}
                  </ul>
                </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}
