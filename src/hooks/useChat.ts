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
  const [error, setError] = useState<string | null>(null);
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
      const requestTimestamp = Date.now();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: requestTimestamp,
        streaming: true,
        toolCalls: [],
        requestData: {
          sessionKey,
          message: text,
          timestamp: requestTimestamp,
        },
        responseEvents: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const toolCalls: ToolCall[] = [];
      const responseEvents: StreamEvent[] = [];

      try {
        await streamMessage(
          sessionKey,
          text,
          token,
          (event: StreamEvent) => {
            // Track all events for debugging
            responseEvents.push(event);
            console.log("[SSE Event]", event.type, event);

            switch (event.type) {
              case "token":
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { 
                          ...m, 
                          content: m.content + (event.text || ""),
                          responseEvents: [...responseEvents],
                        }
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
                      ? { 
                          ...m, 
                          toolCalls: [...toolCalls],
                          responseEvents: [...responseEvents],
                        }
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
                        ? { 
                            ...m, 
                            toolCalls: [...toolCalls],
                            responseEvents: [...responseEvents],
                          }
                        : m
                    )
                  );
                }
                break;

              case "done":
                setMessages((prev) => {
                  const currentMsg = prev.find(m => m.id === assistantId);
                  // If we have no content but the done event has a result, use it
                  const doneEvent = event as { type: "done"; sessionId: string; usage: TokenUsage; durationMs: number; result?: string };
                  const finalContent = currentMsg?.content || doneEvent.result || "";
                  const updated = prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: finalContent || m.content,
                          streaming: false,
                          usage: event.usage,
                          durationMs: event.durationMs,
                          sessionId: event.sessionId,
                          responseEvents: [...responseEvents],
                        }
                      : m
                  );
                  // Log final state for debugging
                  console.log("[Stream Complete]", {
                    messageId: assistantId,
                    contentLength: updated.find(m => m.id === assistantId)?.content.length || 0,
                    tokenCount: event.usage.outputTokens,
                    events: responseEvents.length,
                    hasResult: !!doneEvent.result,
                  });
                  return updated;
                });
                break;

              case "result":
                // Handle result events that contain the final text
                const resultEvent = event as { type: "result"; result?: string; [key: string]: unknown };
                if (resultEvent.result) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: resultEvent.result || m.content,
                            streaming: false,
                            responseEvents: [...responseEvents],
                          }
                        : m
                    )
                  );
                }
                break;

              case "assistant":
                // Handle assistant events that might contain message content
                const assistantEvent = event as { type: "assistant"; message?: { content?: Array<{ type?: string; text?: string }> }; [key: string]: unknown };
                if (assistantEvent.message?.content) {
                  const textParts = assistantEvent.message.content
                    .filter((c: any) => c.type === "text" && c.text)
                    .map((c: any) => c.text)
                    .join("");
                  if (textParts) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId
                          ? {
                              ...m,
                              content: textParts,
                              responseEvents: [...responseEvents],
                            }
                          : m
                      )
                    );
                  }
                }
                break;

              case "user":
              case "unknown":
                // Log but don't process these events
                console.log(`[SSE] Unhandled event type: ${event.type}`, event);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          responseEvents: [...responseEvents],
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
                          responseError: event.message,
                          responseEvents: [...responseEvents],
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
          const errorMessage = (err as Error).message;
          console.error("[Stream Error]", errorMessage, err);
          setError(errorMessage);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    streaming: false,
                    content:
                      m.content +
                      `\n\n[Error: ${errorMessage}]`,
                    responseError: errorMessage,
                    responseEvents: [...responseEvents],
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
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { messages, streaming, send, abort, clearMessages, error, clearError };
}
