import { useCallback, useEffect, useState } from "react";
import { getHealth, validateToken } from "../api/client.ts";

export interface TokenValidationResult {
  serverReachable: boolean;
  tokenValid: boolean | null; // null = not checked yet, true = valid, false = invalid
  error: string | null;
  checking: boolean;
}

/**
 * Validates that the server is reachable and the token is valid.
 * Performs both checks on startup.
 */
export function useTokenValidation(
  sessionKey: string,
  token: string,
  enabled: boolean = true
) {
  const [result, setResult] = useState<TokenValidationResult>({
    serverReachable: false,
    tokenValid: null,
    error: null,
    checking: true,
  });

  const validate = useCallback(async () => {
    if (!enabled) {
      setResult({
        serverReachable: false,
        tokenValid: null,
        error: null,
        checking: false,
      });
      return;
    }

    if (!token || !sessionKey) {
      setResult({
        serverReachable: false,
        tokenValid: null,
        error: "Token or session key not configured",
        checking: false,
      });
      return;
    }

    setResult((prev) => ({ ...prev, checking: true, error: null }));

    // Step 1: Check if server is reachable (no auth required)
    let serverReachable = false;
    try {
      await getHealth();
      serverReachable = true;
    } catch (err) {
      setResult({
        serverReachable: false,
        tokenValid: null,
        error: `Server unreachable: ${(err as Error).message}`,
        checking: false,
      });
      return;
    }

    // Step 2: Validate token
    const tokenResult = await validateToken(sessionKey, token);
    setResult({
      serverReachable: true,
      tokenValid: tokenResult.valid,
      error: tokenResult.error || null,
      checking: false,
    });
  }, [sessionKey, token, enabled]);

  useEffect(() => {
    if (enabled) {
      validate();
    }
  }, [validate, enabled]);

  return { ...result, retry: validate };
}
