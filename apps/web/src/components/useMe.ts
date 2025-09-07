'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';
import { usePathname } from 'next/navigation';

export function useMe() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    const t = getToken();
    if (!t) { setUser(null); setLoading(false); return; }
    setLoading(true);
    api('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // on mount + when route changes, re-validate
  useEffect(() => { refresh(); }, [refresh, pathname]);

  // when token changes (login/logout in any tab), re-validate
  useEffect(() => {
    const onToken = () => refresh();
    window.addEventListener('storage', onToken);
    window.addEventListener('token-updated', onToken as EventListener);
    return () => {
      window.removeEventListener('storage', onToken);
      window.removeEventListener('token-updated', onToken as EventListener);
    };
  }, [refresh]);

  return { user, loading, refresh };
}
