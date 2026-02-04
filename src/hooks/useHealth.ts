import { useCallback, useEffect, useState } from "react";
import { getHealth } from "../api/client.ts";
import type { HealthResponse } from "../types/api.ts";

export function useHealth(intervalMs = 10000) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const h = await getHealth();
      setHealth(h);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(check, 0);
    const id = setInterval(check, intervalMs);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [check, intervalMs]);

  return { health, error, check };
}
