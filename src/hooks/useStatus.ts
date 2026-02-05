import { useCallback, useEffect, useState } from "react";
import { getStatus } from "../api/client.ts";
import type { StatusResponse } from "../types/api.ts";

export function useStatus(token: string, intervalMs = 10000) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const s = await getStatus(token);
      setStatus(s);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setStatus(null);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(check, 0);
    const id = setInterval(check, intervalMs);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [check, intervalMs, token]);

  return { status, error, check };
}
