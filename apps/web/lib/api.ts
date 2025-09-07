export type ApiInit = RequestInit & { auth?: boolean };

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE && process.env.NEXT_PUBLIC_API_BASE.trim() !== ""
    ? process.env.NEXT_PUBLIC_API_BASE
    : "/api/run-proxy";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("token", token);
  else window.localStorage.removeItem("token");
}

function joinUrl(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function api<T = any>(path: string, init: ApiInit = {}): Promise<T> {
  const url = joinUrl(API_BASE, path);

  const headers = new Headers(init.headers || {});
  // Attach JSON header if there's a body and no explicit content-type
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Default auth=true. Only skip if the caller set auth:false.
  const wantsAuth = init.auth !== false;
  if (wantsAuth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const resp = await fetch(url, { ...init, headers });

  // Throw useful error on non-2xx
  if (!resp.ok) {
    let msg = `${resp.status} ${resp.statusText}`;
    try {
      const data = await resp.json();
      msg = (data?.detail || data?.message || msg) as string;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(msg);
  }

  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await resp.json()) as T;
  }
  // fall back to text/other
  return (await resp.text()) as unknown as T;
}
