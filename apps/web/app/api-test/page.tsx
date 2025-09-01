"use client";
import { useState } from "react";

export default function ApiTest() {
  const [out, setOut] = useState<string>("");

  const hitHealth = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/health`, { cache: "no-store" });
    setOut(await res.text());
  };

  const hitGreet = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_BASE}/greet?name=Sam`;
    const res = await fetch(url, { cache: "no-store" });
    setOut(await res.text());
  };

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">API Test</h1>
      <div className="space-x-3">
        <button onClick={hitHealth} className="px-3 py-2 rounded bg-black text-white">/health</button>
        <button onClick={hitGreet} className="px-3 py-2 rounded bg-black text-white">/greet</button>
      </div>
      <pre className="p-4 bg-gray-100 rounded">{out}</pre>
    </main>
  );
}
