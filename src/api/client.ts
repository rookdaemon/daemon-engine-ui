import type {
  HealthResponse,
  MessageResponse,
  SessionResetResponse,
  StreamEvent,
  StatusResponse,
  LogsResponse,
  HistoryResponse,
  DiagnosticResponse,
} from "../types/api.ts";

const BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

/**
 * Validates token by making a test request.
 * Returns true if token is valid, false if invalid, null if unable to determine.
 */
export async function validateToken(
  sessionKey: string,
  token: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Try to call /session/reset as a validation endpoint
    // This validates both token and session configuration
    await resetSession(sessionKey, token);
    // If successful, token is valid (session was reset, but that's acceptable for validation)
    return { valid: true };
  } catch (err) {
    const errorMessage = (err as Error).message.toLowerCase();
    
    if (errorMessage.includes("unauthorized")) {
      return { valid: false, error: "Token is invalid or incorrect" };
    } else if (errorMessage.includes("no hook configured")) {
      return { 
        valid: false, 
        error: `Session '${sessionKey}' is not configured in daemon-engine hooks` 
      };
    } else {
      return { 
        valid: false, 
        error: `Validation failed: ${(err as Error).message}` 
      };
    }
  }
}

export async function sendMessage(
  sessionKey: string,
  message: string,
  token: string
): Promise<MessageResponse> {
  return request<MessageResponse>("/message", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionKey, message }),
  });
}

export async function resetSession(
  sessionKey: string,
  token: string
): Promise<SessionResetResponse> {
  return request<SessionResetResponse>("/session/reset", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionKey }),
  });
}

export function streamMessage(
  sessionKey: string,
  message: string,
  token: string,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    fetch(`${BASE}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionKey, message }),
      signal,
    })
      .then((res) => {
        if (!res.ok) {
          return res
            .json()
            .catch(() => ({ error: res.statusText }))
            .then((body) => {
              throw new Error(
                (body as { error?: string }).error || `HTTP ${res.status}`
              );
            });
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let eventCount = 0;

        function processChunk(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              // Process any remaining buffer
              if (buffer.trim()) {
                console.warn("[SSE] Unprocessed buffer at end:", buffer);
              }
              console.log(`[SSE] Stream complete. Processed ${eventCount} events.`);
              resolve();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            let currentEventType = "";
            for (const line of lines) {
              const trimmed = line.trim();
              
              if (trimmed.startsWith("event: ")) {
                currentEventType = trimmed.slice(7).trim();
              } else if (trimmed.startsWith("data: ")) {
                try {
                  const dataStr = trimmed.slice(6);
                  const data = JSON.parse(dataStr);
                  const event = { type: currentEventType || "unknown", ...data } as StreamEvent;
                  
                  if (!currentEventType) {
                    console.warn("[SSE] Received data without event type:", dataStr);
                  }
                  
                  eventCount++;
                  onEvent(event);
                } catch (err) {
                  console.error("[SSE] Failed to parse data line:", trimmed, err);
                }
                currentEventType = "";
              } else if (trimmed === "") {
                // Empty line resets event type (SSE format)
                currentEventType = "";
              } else if (trimmed.startsWith(":")) {
                // SSE comment, ignore
              } else {
                // Unexpected line format
                console.warn("[SSE] Unexpected line format:", trimmed);
              }
            }

            return processChunk();
          });
        }

        return processChunk();
      })
      .catch(reject);
  });
}

export async function getStatus(token: string): Promise<StatusResponse> {
  return request<StatusResponse>("/status", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getLogs(
  token: string,
  lines?: number
): Promise<LogsResponse> {
  const params = lines ? `?lines=${lines}` : "";
  return request<LogsResponse>(`/logs${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getHistory(
  token: string,
  limit?: number
): Promise<HistoryResponse> {
  const params = limit ? `?limit=${limit}` : "";
  return request<HistoryResponse>(`/history${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function runDiagnostic(
  token: string,
  checks?: string[]
): Promise<DiagnosticResponse> {
  return request<DiagnosticResponse>("/diagnostic", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ checks }),
  });
}
