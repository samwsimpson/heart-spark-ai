"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken, setToken } from "@/lib/api";

export default function Nav() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const check = () => setAuthed(!!getToken());
    check();
    const onStorage = (e: StorageEvent) => { if (e.key === "token") check(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <nav className="border-b bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-4">
        <Link href="/" className="font-medium">Heart Spark</Link>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link href="/chat-test" className="underline">Chat test</Link>
          <Link href="/dashboard" className="underline">Dashboard</Link>
          {authed ? (
            <button
              onClick={() => { setToken(null); setAuthed(false); location.href = "/"; }}
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
