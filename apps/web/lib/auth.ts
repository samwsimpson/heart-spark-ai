const KEY = "heart_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}
export function setToken(tok: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, tok);
}
export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
