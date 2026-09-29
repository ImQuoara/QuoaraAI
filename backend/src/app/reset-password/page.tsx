'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError('Use at least 12 characters.');
      return;
    }
    if (password !== repeat) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('Password reset session is missing or expired. Request a new reset link.');
        return;
      }
      router.replace('/chat');
      router.refresh();
    } catch {
      setError('Could not update the password right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">Owner recovery</p>
          <h1 className="mt-2 text-3xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-400">This page requires the one-time Supabase recovery session from your newest reset email.</p>
        </div>
        {error && <p className="rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
        <input aria-label="New password" type="password" required minLength={12} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-400" />
        <input aria-label="Repeat new password" type="password" required minLength={12} autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} placeholder="Repeat new password" className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-400" />
        <button disabled={loading} className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black disabled:opacity-50">
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </main>
  );
}
