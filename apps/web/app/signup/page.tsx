"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type SignupIn = { email: string; username: string; password: string; };

export default function SignupPage() {
  const [form, setForm] = useState<SignupIn>({ email: "", username: "", password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await api("/auth/signup", { method: "POST", body: JSON.stringify(form) });
      setMsg("Account created. You can log in now.");
    } catch (e: any) {
      setMsg(e?.body?.detail || e.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md bg-white rounded-2xl shadow p-6">
      <h1 className="text-xl font-semibold mb-4">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input value={form.email}
                 onChange={e=>setForm(f=>({...f, email:e.target.value}))}
                 type="email" required
                 className="w-full rounded-md border px-3 py-2 bg-white text-neutral-900" />
        </div>
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input value={form.username}
                 onChange={e=>setForm(f=>({...f, username:e.target.value}))}
                 required minLength={3}
                 className="w-full rounded-md border px-3 py-2 bg-white text-neutral-900" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input value={form.password}
                 onChange={e=>setForm(f=>({...f, password:e.target.value}))}
                 type="password" required minLength={8}
                 className="w-full rounded-md border px-3 py-2 bg-white text-neutral-900" />
        </div>
        <button disabled={busy}
                className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60">
          {busy ? "Creating..." : "Sign up"}
        </button>
        {msg && <p className="text-sm text-neutral-700">{msg}</p>}
        <p className="text-sm text-neutral-600">
          Already have an account? <Link className="underline" href="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
