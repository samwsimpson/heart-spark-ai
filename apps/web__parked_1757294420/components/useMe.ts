"use client";

import { useEffect, useState } from "react";
import { api, getToken } from "@/lib/api";

export type User = {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
};

export function useMe() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          if (alive) setUser(null);
        } else {
          const me = await api("/auth/me");
          if (alive) setUser(me);
        }
      } catch (e: any) {
        if (alive) {
          setError(e?.message || "Failed to load user");
          setUser(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    const onAuthChanged = () => load();
    window.addEventListener("auth:changed", onAuthChanged);
    return () => {
      alive = false;
      window.removeEventListener("auth:changed", onAuthChanged);
    };
  }, []);

  return { user, loading, error, refresh: async () => setUser(await api("/auth/me")) };
}
