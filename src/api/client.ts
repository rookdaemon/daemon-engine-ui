import type {
  HealthResponse,
  MessageResponse,
  SessionResetResponse,
  StreamEvent,
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

        function processChunk(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              resolve();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            let currentEventType = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEventType = line.slice(7).trim();
              } else if (line.startsWith("data: ") && currentEventType) {
                try {
                  const data = JSON.parse(line.slice(6));
                  onEvent({ type: currentEventType, ...data } as StreamEvent);
                } catch {
                  // skip malformed SSE data
                }
                currentEventType = "";
              } else if (line.trim() === "") {
                currentEventType = "";
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
