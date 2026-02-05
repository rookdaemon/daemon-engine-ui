import { useCallback, useRef, useState } from "react";
import { streamMessage, getSessionMessages } from "../api/client.ts";
import type { ChatMessage, StreamEvent, ToolCall, SessionMessage } from "../types/api.ts";

let nextId = 0;
function genId(): string {
  return `msg-${Date.now()}-${nextId++}`;
}

// Helper to recursively extract text from nested objects
function extractTextFromEvent(event: any): string {
  if (typeof event === "string") return event;
  if (typeof event !== "object" || event === null) return "";
  
  // Check common fields
  if (event.result) return String(event.result);
  if (event.text) return String(event.text);
  if (event.content) {
    if (typeof event.content === "string") return event.content;
    if (Array.isArray(event.content)) {
      return event.content
        .filter((c: any) => c?.type === "text" && c?.text)
        .map((c: any) => c.text)
        .join("");
    }
  }
  
  // Check nested message.content
  if (event.message?.content) {
    if (Array.isArray(event.message.content)) {
      const text = event.message.content
        .filter((c: any) => c?.type === "text" && c?.text)
        .map((c: any) => c.text)
        .join("");
      if (text) return text;
    }
  }
  
  // Recursively search in nested objects (limited depth)
  const searchDepth = (obj: any, depth: number): string => {
    if (depth > 3) return ""; // Limit recursion depth
    if (typeof obj !== "object" || obj === null) return "";
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === "result" || key === "text" || key === "content") {
        const found = extractTextFromEvent(value);
        if (found) return found;
      }
      if (typeof value === "object" && value !== null) {
        const found = searchDepth(value, depth + 1);
        if (found) return found;
      }
    }
    return "";
  };
  
  return searchDepth(event, 0);
}

export function useChat(sessionKey: string, token: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
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
                  // Extract result from any possible field in the done event using recursive search
                  const doneEvent = event as any;
                  const resultText = extractTextFromEvent(doneEvent);
                  
                  const finalContent = currentMsg?.content || resultText || "";
                  
                  console.log("[Done Event Debug]", {
                    messageId: assistantId,
                    currentContentLength: currentMsg?.content.length || 0,
                    resultTextLength: resultText.length,
                    resultTextPreview: resultText.substring(0, 200),
                    finalContentLength: finalContent.length,
                    tokenCount: event.usage.outputTokens,
                    eventKeys: Object.keys(doneEvent),
                    fullEvent: JSON.stringify(doneEvent, null, 2).substring(0, 500),
                  });
                  
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
                    hasResult: !!resultText,
                  });
                  return updated;
                });
                break;

              case "result":
                // Handle result events that contain the final text
                const resultEvent = event as any;
                const resultText = extractTextFromEvent(resultEvent);
                
                console.log("[Result Event Debug]", {
                  messageId: assistantId,
                  resultTextLength: resultText.length,
                  resultTextPreview: resultText.substring(0, 200),
                  eventKeys: Object.keys(resultEvent),
                  fullEvent: JSON.stringify(resultEvent, null, 2).substring(0, 500),
                });
                
                if (resultText) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: resultText,
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
                const assistantEvent = event as any;
                const textParts = extractTextFromEvent(assistantEvent);
                
                console.log("[Assistant Event Debug]", {
                  messageId: assistantId,
                  textPartsLength: textParts.length,
                  textPartsPreview: textParts.substring(0, 200),
                  hasMessage: !!assistantEvent.message,
                  hasContent: !!assistantEvent.content,
                  eventKeys: Object.keys(assistantEvent),
                  fullEvent: JSON.stringify(assistantEvent, null, 2).substring(0, 500),
                });
                
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

  const loadHistory = useCallback(
    async (limit = 50) => {
      setLoadingHistory(true);
      setError(null);
      
      try {
        const response = await getSessionMessages(sessionKey, token, limit);
        
        // Convert SessionMessage to ChatMessage
        const historyMessages: ChatMessage[] = response.messages.map((msg: SessionMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          usage: msg.usage,
          toolCalls: msg.toolCalls,
          streaming: false,
        }));
        
        setMessages(historyMessages);
      } catch (err) {
        const errorMessage = (err as Error).message;
        console.error("[History Load Error]", errorMessage, err);
        
        // If the endpoint doesn't exist yet (404), fail silently
        // Error message format from request() is: "HTTP 404" or similar
        if (errorMessage.includes("HTTP 404") || errorMessage.includes("Not Found")) {
          console.warn("[History] Endpoint not available yet, starting with empty history");
          setMessages([]);
        } else {
          setError(`Failed to load message history: ${errorMessage}`);
        }
      } finally {
        setLoadingHistory(false);
      }
    },
    [sessionKey, token]
  );

  return { messages, streaming, loadingHistory, send, abort, clearMessages, loadHistory, error, clearError };
}
