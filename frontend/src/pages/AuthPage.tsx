import { useState, type FormEvent } from 'react';
import PixelButton from '../components/PixelButton';
import { loginAccount, registerAccount, type AuthUser } from '../services/api';
import './AuthPage.css';

export default function AuthPage({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identity, setIdentity] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function switchMode(next: 'login' | 'signup') { setMode(next); setError(''); setPassword(''); setConfirmPassword(''); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (mode === 'signup') {
      if (!/^[A-Za-z0-9_]{3,24}$/.test(username.trim())) { setError('Username must be 3–24 letters, numbers, or underscores.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }
    setBusy(true); setError('');
    try {
      const user = mode === 'signup'
        ? await registerAccount({ username: username.trim(), email: email.trim(), password, confirmPassword })
        : await loginAccount(identity.trim(), password);
      onAuthenticated(user);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not connect. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-screen app">
    <section className="auth-card pixel-panel" aria-labelledby="auth-title">
      <div className="auth-stars" aria-hidden="true">✦ · ✧ · ✦</div>
      <span className="eyebrow">A LITTLE WORLD OF YOUR OWN</span>
      <h1>MY LITTLE LIFE</h1>
      <h2 id="auth-title">{mode === 'signup' ? 'CREATE YOUR LIFE' : 'Welcome Back!'}</h2>
      <form onSubmit={(event) => void submit(event)}>
        {mode === 'signup' ? <>
          <label htmlFor="auth-username">Username</label>
          <input id="auth-username" autoComplete="username" maxLength={24} required value={username} onChange={(event) => setUsername(event.target.value)} />
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
        </> : <>
          <label htmlFor="auth-identity">Email or Username</label>
          <input id="auth-identity" autoComplete="username" required value={identity} onChange={(event) => setIdentity(event.target.value)} />
        </>}
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} />
        {mode === 'signup' && <>
          <label htmlFor="auth-confirm">Confirm Password</label>
          <input id="auth-confirm" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <PixelButton disabled={busy} type="submit">{busy ? 'PLEASE WAIT…' : mode === 'signup' ? 'CREATE ACCOUNT' : 'LOG IN'}</PixelButton>
      </form>
      <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New here?'}</p>
      <button type="button" className="auth-switch-button" onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}>
        {mode === 'signup' ? 'LOG IN' : 'CREATE ACCOUNT'}
      </button>
    </section>
  </main>;
}
