import { useCallback, useState } from "react";
import type { ChatMessage } from "../types/api.ts";

interface Props {
  message: ChatMessage;
}

export function MessageDetails({ message }: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const hasDetails = message.requestData || message.responseEvents || message.responseError;

  if (!hasDetails) return null;

  return (
    <div className="mt-2 border border-zinc-700 rounded text-xs">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-800 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span className="text-zinc-400">Request/Response Details</span>
        {message.responseError && (
          <span className="text-red-400 ml-auto">Error</span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-zinc-700 px-3 py-2 space-y-3">
          {/* Request Data */}
          {message.requestData && (
            <div>
              <div className="text-zinc-500 mb-1 font-medium">Request</div>
              <div className="bg-zinc-950 p-2 rounded space-y-1">
                <div>
                  <span className="text-zinc-500">Session Key:</span>{" "}
                  <span className="text-zinc-300 font-mono">
                    {message.requestData.sessionKey}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Message:</span>
                  <pre className="mt-1 text-zinc-300 whitespace-pre-wrap break-words">
                    {message.requestData.message}
                  </pre>
                </div>
                <div className="text-zinc-500 text-[10px]">
                  Sent: {new Date(message.requestData.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Response Error */}
          {message.responseError && (
            <div>
              <div className="text-red-400 mb-1 font-medium">Error</div>
              <div className="bg-red-950/20 border border-red-900/50 p-2 rounded text-red-300">
                {message.responseError}
              </div>
            </div>
          )}

          {/* Response Events */}
          {message.responseEvents && message.responseEvents.length > 0 && (
            <div>
              <div className="text-zinc-500 mb-1 font-medium">
                Response Events ({message.responseEvents.length})
              </div>
              <div className="bg-zinc-950 p-2 rounded space-y-2 max-h-96 overflow-y-auto">
                {message.responseEvents.map((event, idx) => (
                  <div key={idx} className="border-l-2 border-zinc-700 pl-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-indigo-400 font-mono text-[10px]">
                        {event.type}
                      </span>
                      {event.type === "token" && (
                        <span className="text-zinc-500 text-[10px]">
                          ({event.text?.length || 0} chars)
                        </span>
                      )}
                      {event.type === "done" && (
                        <span className="text-zinc-500 text-[10px]">
                          {event.usage?.outputTokens || 0} tokens
                        </span>
                      )}
                      {event.type === "result" && (
                        <span className="text-green-400 text-[10px]">
                          Final result
                        </span>
                      )}
                      {event.type === "assistant" && (
                        <span className="text-blue-400 text-[10px]">
                          Assistant message
                        </span>
                      )}
                    </div>
                    <pre className="text-zinc-300 text-[10px] whitespace-pre-wrap break-words">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Debug Info */}
          {message.role === "assistant" && (
            <div>
              <div className="text-zinc-500 mb-1 font-medium">Content Debug</div>
              <div className="bg-zinc-950 p-2 rounded space-y-1 text-[10px]">
                <div>
                  <span className="text-zinc-500">Content Length:</span>{" "}
                  <span className="text-zinc-300">
                    {message.content.length} characters
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Is Empty:</span>{" "}
                  <span className={`text-[10px] ${message.content.length === 0 ? "text-red-400" : "text-green-400"}`}>
                    {message.content.length === 0 ? "Yes" : "No"}
                  </span>
                </div>
                {message.usage && (
                  <div>
                    <span className="text-zinc-500">Expected Tokens:</span>{" "}
                    <span className="text-zinc-300">
                      {message.usage.outputTokens}
                    </span>
                  </div>
                )}
                {message.responseEvents && (
                  <div>
                    <span className="text-zinc-500">Token Events:</span>{" "}
                    <span className="text-zinc-300">
                      {message.responseEvents.filter((e) => e.type === "token").length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
