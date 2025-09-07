'use client';
import Link from 'next/link';
import { useMe } from '@/components/useMe';
import { setToken } from '@/lib/api';

export default function Nav() {
  const { user, loading } = useMe();

  return (
    <nav className="w-full border-b bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 text-sm">
        <Link href="/" className="font-medium">Heart Spark</Link>
        <div className="space-x-3">
          <Link href="/chat-test" className="underline">Chat test</Link>
          <Link href="/dashboard" className="underline">Dashboard</Link>
          {loading ? (
            <span className="text-neutral-500">…</span>
          ) : user ? (
            <button
              onClick={() => { setToken(null); location.href = '/'; }}
              className="rounded-md border px-3 py-1.5"
            >
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="rounded-md border px-3 py-1.5">Log in</Link>
              <Link href="/signup" className="rounded-md border px-3 py-1.5">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
