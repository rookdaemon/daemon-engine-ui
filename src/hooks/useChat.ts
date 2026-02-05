import { useCallback, useEffect, useRef, useState } from "react";
import { streamMessage, getHistory } from "../api/client.ts";
import type { ChatMessage, StreamEvent, ToolCall, HistoryEntry } from "../types/api.ts";

let nextId = 0;
function genId(): string {
  return `msg-${Date.now()}-${nextId++}`;
}

export function useChat(sessionKey: string, token: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Load history on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    
    getHistory(token, 100)
      .then((response) => {
        if (cancelled) return;
        
        // Filter history to current session and convert to ChatMessage format
        const sessionHistory = response.history.filter(
          (entry: HistoryEntry) => entry.sessionKey === sessionKey
        );
        
        const restoredMessages: ChatMessage[] = sessionHistory.map((entry) => ({
          id: genId(),
          role: entry.role === "tool" ? "assistant" : entry.role,
          content: entry.content || "",
          timestamp: entry.timestamp,
        }));
        
        setMessages(restoredMessages);
        setLoadingHistory(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load history:", err);
        setLoadingHistory(false);
      });
    
    return () => {
      cancelled = true;
    };
  }, [sessionKey, token]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const assistantId = genId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const toolCalls: ToolCall[] = [];

      try {
        await streamMessage(
          sessionKey,
          text,
          token,
          (event: StreamEvent) => {
            switch (event.type) {
              case "token":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.text }
                      : m
                  )
                );
                break;

              case "tool_call":
                toolCalls.push({
                  id: event.id,
                  name: event.name,
                  input: event.input,
                });
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...toolCalls] }
                      : m
                  )
                );
                break;

              case "tool_result":
                {
                  const tc = toolCalls.find((t) => t.id === event.id);
                  if (tc) tc.output = event.output;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, toolCalls: [...toolCalls] }
                        : m
                    )
                  );
                }
                break;

              case "done":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          streaming: false,
                          usage: event.usage,
                          durationMs: event.durationMs,
                          sessionId: event.sessionId,
                        }
                      : m
                  )
                );
                break;

              case "error":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          streaming: false,
                          content:
                            m.content + `\n\n[Error: ${event.message}]`,
                        }
                      : m
                  )
                );
                break;
            }
          },
          controller.signal
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    streaming: false,
                    content:
                      m.content +
                      `\n\n[Error: ${(err as Error).message}]`,
                  }
                : m
            )
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [sessionKey, token, streaming]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, streaming, loadingHistory, send, abort, clearMessages };
}
