"use client";
import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE ?? "ws://localhost:8081";

export default function ChatTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => () => wsRef.current?.close(), []);

  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_BASE}/ws/chat`);
    wsRef.current = ws;
    ws.onopen = () => setMessages((m) => [...m, "🔌 Connected"]);
    ws.onmessage = (evt) => setMessages((m) => [...m, `👤 ${evt.data}`]);
    ws.onclose = () => setMessages((m) => [...m, "🔒 Disconnected"]);
    ws.onerror = () => setMessages((m) => [...m, "⚠️ Error"]);
  };

  const send = () => {
    if (!value.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(value);
      setMessages((m) => [...m, `🫵 ${value}`]);
      setValue("");
    } else {
      setMessages((m) => [...m, "⚠️ Not connected"]);
    }
  };

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Chat Test</h1>

      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={connect} className="btn-primary">Connect</button>
          <a href={`${API_BASE}/health`} target="_blank" rel="noreferrer" className="btn-outline">Ping API</a>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="input"
            placeholder="Type a message…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} className="btn-primary">Send</button>
        </div>

        <ul className="space-y-1 max-h-64 overflow-auto text-sm">
          {messages.map((m, i) => (
            <li key={i} className="text-slate-800 dark:text-slate-200">{m}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
