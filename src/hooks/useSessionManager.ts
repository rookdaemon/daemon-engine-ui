import { useState, useCallback, useMemo } from "react";
import type { ChatMessage } from "../types/api.ts";

export interface SessionMetadata {
  sessionKey: string;
  messageCount: number;
  lastActive: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
}

/**
 * Parses session keys from VITE_SESSION_KEYS env var (comma-separated).
 * Example: "webchat:main,heartbeat:cron,agora:default"
 */
function parseSessionKeys(): string[] {
  const envKeys = import.meta.env.VITE_SESSION_KEYS as string | undefined;
  if (!envKeys) {
    return ["webchat:main"]; // Default if not configured
  }
  return envKeys.split(",").map((k) => k.trim()).filter(Boolean);
}

export function useSessionManager() {
  const [activeSessionKey, setActiveSessionKey] = useState<string>(() => {
    const keys = parseSessionKeys();
    return keys[0] || "webchat:main";
  });

  const [sessionKeys, setSessionKeys] = useState<string[]>(parseSessionKeys);
  
  // Track messages per session
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});

  // Add a new session
  const addSession = useCallback((sessionKey: string) => {
    if (!sessionKey.trim()) return;
    setSessionKeys((prev) => {
      if (prev.includes(sessionKey)) return prev;
      return [...prev, sessionKey];
    });
    setActiveSessionKey(sessionKey);
  }, []);

  // Remove a session
  const removeSession = useCallback((sessionKey: string) => {
    setSessionKeys((prev) => {
      const filtered = prev.filter((k) => k !== sessionKey);
      if (filtered.length === 0) return prev; // Keep at least one session
      return filtered;
    });
    setSessionMessages((prev) => {
      const updated = { ...prev };
      delete updated[sessionKey];
      return updated;
    });
    // If we're removing the active session, switch to the first remaining one
    if (activeSessionKey === sessionKey) {
      setActiveSessionKey((current) => {
        const remaining = sessionKeys.filter((k) => k !== sessionKey);
        return remaining[0] || current;
      });
    }
  }, [activeSessionKey, sessionKeys]);

  // Update messages for a session
  const updateSessionMessages = useCallback((sessionKey: string, messages: ChatMessage[]) => {
    setSessionMessages((prev) => ({
      ...prev,
      [sessionKey]: messages,
    }));
  }, []);

  // Clear messages for a session
  const clearSessionMessages = useCallback((sessionKey: string) => {
    setSessionMessages((prev) => ({
      ...prev,
      [sessionKey]: [],
    }));
  }, []);

  // Compute metadata for all sessions
  const sessionsMetadata = useMemo<SessionMetadata[]>(() => {
    return sessionKeys.map((sessionKey) => {
      const messages = sessionMessages[sessionKey] || [];
      
      const totalTokens = messages.reduce(
        (acc, m) => {
          if (m.usage) {
            acc.input += m.usage.inputTokens;
            acc.output += m.usage.outputTokens;
            acc.cache += m.usage.cacheReadTokens;
          }
          return acc;
        },
        { input: 0, output: 0, cache: 0 }
      );

      const lastActive = messages.length > 0 
        ? Math.max(...messages.map((m) => m.timestamp))
        : 0;

      return {
        sessionKey,
        messageCount: messages.length,
        lastActive,
        totalInputTokens: totalTokens.input,
        totalOutputTokens: totalTokens.output,
        totalCacheReadTokens: totalTokens.cache,
      };
    });
  }, [sessionKeys, sessionMessages]);

  return {
    activeSessionKey,
    setActiveSessionKey,
    sessionKeys,
    addSession,
    removeSession,
    updateSessionMessages,
    clearSessionMessages,
    sessionsMetadata,
  };
}
