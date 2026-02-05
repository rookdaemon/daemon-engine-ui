import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/api.ts";
import { ToolCallDetail } from "./ToolCallDetail.tsx";

interface Props {
  messages: ChatMessage[];
  loadingHistory?: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageList({ messages, loadingHistory }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        <span className="animate-pulse">Restoring conversation...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        No messages yet. Send a message to begin.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`max-w-4xl mx-auto ${msg.role === "user" ? "flex justify-end" : ""}`}
        >
          <div
            className={`rounded-lg px-4 py-3 ${
              msg.role === "user"
                ? "bg-indigo-600 text-white max-w-[75%]"
                : "bg-zinc-800 text-zinc-100 w-full"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium opacity-70">
                {msg.role === "user" ? "You" : "Rook"}
              </span>
              <span className="text-xs opacity-50">
                {formatTime(msg.timestamp)}
              </span>
              {msg.streaming && (
                <span className="text-xs text-yellow-400 animate-pulse ml-auto">
                  streaming...
                </span>
              )}
            </div>
            <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {msg.content}
              {msg.streaming && !msg.content && (
                <span className="animate-pulse text-zinc-500">...</span>
              )}
            </div>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <ToolCallDetail toolCalls={msg.toolCalls} />
            )}
            {msg.usage && (
              <div className="mt-2 flex gap-3 text-[10px] text-zinc-500 font-mono">
                <span>in:{msg.usage.inputTokens.toLocaleString()}</span>
                <span>out:{msg.usage.outputTokens.toLocaleString()}</span>
                {msg.usage.cacheReadTokens > 0 && (
                  <span>
                    cache:{msg.usage.cacheReadTokens.toLocaleString()}
                  </span>
                )}
                {msg.durationMs !== undefined && (
                  <span>{(msg.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
