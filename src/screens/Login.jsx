import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import RehrigLogo from '../components/RehrigLogo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useDemoUsers } from '../hooks/useDemoUsers.js';
import { getErrorMessage } from '../lib/errors.js';
import loginBg from '../assets/login-background.svg';
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
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundColor: '#0F437B',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Absolute Logo */}
      <div className="absolute top-6 left-6 lg:top-12 lg:left-12">
        <RehrigLogo className="w-32 lg:w-48 brightness-0 invert" />
      </div>

      <a href={`#${formDomId}`} className="skip-link">
        Skip to sign in
      </a>

      {/* Centered Content Wrapper */}
      <div className="flex w-full max-w-[60rem] flex-col items-center justify-center gap-12 lg:flex-row lg:items-center lg:justify-between z-10 mt-12 lg:mt-0">
        
        {/* Left Title Section */}
        <section className="flex flex-col text-center lg:text-right w-full lg:w-auto">
          <h1 className="font-display text-4xl lg:text-[4rem] font-bold tracking-tight mb-4 text-white leading-[1.1]">
            Secure<br />Partner<br />Gateway
          </h1>
          <p className="text-sm lg:text-base leading-relaxed text-white">
            Guided companion flow designed to scale your<br />operations safely and beautifully.
          </p>
        </section>

        {/* Right Login Card */}
        <section className="w-full max-w-[28rem] bg-[#eef1f6] shadow-float rounded border border-line overflow-hidden shrink-0">
        <div className="px-8 py-10 lg:px-10 lg:py-12">
          {/* Logo / Brand */}
          <div className="mb-10 flex items-center gap-2 text-[#0b386e]">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0b386e] text-white">
              <Icon name="star" size={14} className="fill-current" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">VisionPulse</span>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0b386e]">
              Welcome back
            </p>
            <h2 id="signin-heading" className="font-display text-3xl font-bold tracking-tight text-[#0b386e]">
              Let&apos;s get started.
            </h2>
          </div>

          <form
            id={formDomId}
            onSubmit={signIn}
            className="space-y-6"
            noValidate
            aria-busy={busy}
          >
            <div>
              <label htmlFor={usernameId} className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#0b386e]/70">
                Registered Email <span className="text-danger">*</span>
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
                  className={`login-field login-field-icon bg-white text-sm ${
                    fieldErrors.username ? 'login-field-error' : ''
                  }`}
                  placeholder="Enter your registered email"
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
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor={passwordId} className="block text-[10px] font-bold uppercase tracking-wider text-[#0b386e]/70">
                  Password <span className="text-danger">*</span>
                </label>
                <button type="button" className="text-xs font-semibold text-[#0b386e] hover:underline">
                  Forgot Password?
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
                  className={`login-field login-field-icon login-field-password bg-white text-sm ${
                    fieldErrors.password ? 'login-field-error' : ''
                  }`}
                  placeholder="Enter your secure password"
                  required
                  disabled={busy}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint interactive hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
                  ? 'flex gap-2 rounded-control border border-danger/25 bg-danger-soft px-3 py-2.5 text-sm text-danger outline-none'
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
              className="flex min-h-[3rem] w-full items-center justify-center rounded bg-[#103b6e] text-sm font-semibold text-white transition-colors hover:bg-[#0c2f59] disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span
                    className="loading-spinner border-white/30 border-t-white mr-2"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Login
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#0b386e]/40">or</span>
          </div>

          <button
            type="button"
            onClick={startSso}
            disabled={busy}
            className="flex min-h-[3rem] w-full items-center justify-center rounded border border-[#103b6e] text-sm font-semibold text-[#103b6e] transition-colors hover:bg-[#103b6e]/5 disabled:opacity-50 bg-white"
          >
            Continue with Rehrig SSO
          </button>

          {/* Hidden demo accounts toggle for development */}
          <div className="mt-8 pt-4 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setDemoOpen((open) => !open)}
              className="text-[10px] text-ink-faint hover:text-ink-muted"
            >
              Sample accounts
            </button>
          </div>

          {demoOpen && (
              <div
                id={demoPanelId}
                className="mt-3 animate-fade-in text-center"
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
                      className={`rounded-control px-2.5 py-1 text-[11px] font-medium interactive ${
                        demoTab === tab.key
                          ? 'bg-elevated text-ink-soft'
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
                        className="flex w-full items-center justify-between gap-2 rounded-control px-2 py-1.5 text-left interactive hover:bg-elevated/70 disabled:cursor-not-allowed disabled:opacity-40"
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
