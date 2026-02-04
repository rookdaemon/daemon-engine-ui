import { useCallback, useRef, useState } from "react";
import { streamMessage } from "../api/client.ts";
import type { ChatMessage, StreamEvent, ToolCall } from "../types/api.ts";

let nextId = 0;
function genId(): string {
  return `msg-${Date.now()}-${nextId++}`;
}

export function useChat(sessionKey: string, token: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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

  return { messages, streaming, send, abort, clearMessages };
}
