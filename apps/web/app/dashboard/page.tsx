'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/auth/me'); // will 401 if not logged in
        if (!cancelled) setMe(data);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || 'Not logged in');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={() => { setToken(null); location.href = '/'; }}
          className="rounded-md border px-3 py-1.5"
        >
          Sign out
        </button>
      </div>

      {err && (
        <p className="text-red-600">
          {err}. <Link className="underline" href="/login">Log in</Link> or{' '}
          <Link className="underline" href="/signup">sign up</Link>.
        </p>
      )}

      {me && (
        <div className="rounded-lg border p-4">
          <p className="font-medium">Welcome, {me.username}</p>
          <p className="text-sm text-neutral-600">{me.email}</p>
          <div className="mt-4">
            <Link href="/chat-test" className="underline">Go to Chat test</Link>
          </div>
        </div>
      )}
    </main>
  );
}
