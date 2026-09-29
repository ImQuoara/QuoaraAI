'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('Sign-in timed out.')), 15_000),
        ),
      ]);

      if (result.error) {
        setError('Unable to sign in with those credentials.');
        return;
      }

      router.replace('/chat');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'Sign-in timed out.'
          ? 'Sign-in timed out. Check your connection and try again.'
          : 'Unable to sign in right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    const target = email.trim();
    if (!target) {
      setError('Enter your owner email first.');
      return;
    }

    setResetLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(target, { redirectTo });
      if (resetError) {
        setError('Could not send the password reset email.');
        return;
      }
      setNotice('Password reset email sent. Open the newest link and set a new password.');
    } catch {
      setError('Could not start password recovery right now.');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Owner-only</p>
          <h1 className="mt-2 text-3xl font-bold">QuoaraAi</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-400">Only the configured owner account may access this build.</p>
        </div>
        {error && <p className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}
        <input aria-label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Owner email" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-400" />
        <input aria-label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-400" />
        <button disabled={loading || resetLoading} className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <button type="button" disabled={loading || resetLoading} onClick={resetPassword} className="w-full rounded-xl border border-neutral-700 px-4 py-3 text-sm text-neutral-200 disabled:opacity-50">
          {resetLoading ? 'Sending reset…' : 'Forgot password'}
        </button>
        <p className="text-xs leading-5 text-neutral-500">Public signup is disabled. Provider and hosting security controls remain in force.</p>
      </form>
    </main>
  );
}
