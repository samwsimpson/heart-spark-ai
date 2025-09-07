"use client";
import { useState } from "react";

export default function ChatTest() {
  const [name, setName] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

  async function callGreet() {
    try {
      const u = new URL("/greet", API);
      u.searchParams.set("name", name || "Sam");
      const res = await fetch(u.toString());
      const j = await res.json();
      setOut(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setOut("Error: " + (e?.message ?? String(e)));
    }
  }

  async function callHealth() {
    try {
      const u = new URL("/health", API);
      const res = await fetch(u.toString());
      const j = await res.json();
      setOut(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setOut("Error: " + (e?.message ?? String(e)));
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Chat Test</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Calls your API&apos;s <code>/greet</code> and <code>/health</code>.
          </p>

          <div className="mt-5 flex gap-3 items-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm
                         text-neutral-900 placeholder-neutral-500 outline-none
                         focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
            <button
              onClick={callGreet}
              className="rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                         px-4 py-2 text-white text-sm font-medium shadow"
            >
              Call /greet
            </button>
            <button
              onClick={callHealth}
              className="rounded-md bg-green-600 hover:bg-green-700 active:bg-green-800
                         px-4 py-2 text-white text-sm font-medium shadow"
            >
              Call /health
            </button>
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-neutral-700">Output</label>
            <pre className="mt-2 rounded-lg bg-neutral-900 text-neutral-100 p-4 text-sm overflow-auto">
              {out ?? "No output yet"}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
