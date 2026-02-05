import type { HealthResponse } from "../types/api.ts";
import type { ChatMessage } from "../types/api.ts";

interface Props {
  health: HealthResponse | null;
  healthError: string | null;
  messages: ChatMessage[];
}

function formatUptime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function StatusBar({ health, healthError, messages }: Props) {
  // Detect session ID changes for context reset indicator
  const assistantMsgs = messages.filter(
    (m) => m.role === "assistant" && m.sessionId
  );
  const lastSessionId =
    assistantMsgs.length > 0
      ? assistantMsgs[assistantMsgs.length - 1].sessionId
      : undefined;
  const sessionChanged =
    assistantMsgs.length >= 2 &&
    assistantMsgs[assistantMsgs.length - 1].sessionId !==
      assistantMsgs[assistantMsgs.length - 2].sessionId;

  // Total tokens across all messages
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

  const totalAll = totalTokens.input + totalTokens.output;
  const contextPct = Math.min((totalAll / 150000) * 100, 100);

  return (
    <div className="border-t border-zinc-700 bg-zinc-900 px-4 py-1.5 flex items-center gap-4 text-[11px] font-mono text-zinc-500">
      {/* Health indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            health ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {health ? (
          <span>
            {health.version} &middot; up {formatUptime(health.uptime)}
          </span>
        ) : (
          <span className="text-red-400">{healthError || "disconnected"}</span>
        )}
      </div>

      {/* Context budget bar */}
      {totalAll > 0 && (
        <div className="flex items-center gap-2">
          <span>ctx</span>
          <div className="w-24 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                contextPct > 80
                  ? "bg-red-500"
                  : contextPct > 50
                    ? "bg-yellow-500"
                    : "bg-indigo-500"
              }`}
              style={{ width: `${contextPct}%` }}
            />
          </div>
          <span>{totalAll.toLocaleString()} tok</span>
        </div>
      )}

      {/* Session ID */}
      {lastSessionId && (
        <div className="flex items-center gap-1">
          <span className="text-zinc-600">sid:</span>
          <span>{lastSessionId.slice(0, 8)}</span>
          {sessionChanged && (
            <span className="text-yellow-400 font-bold" title="Context was reset — new Claude session">
              RESET
            </span>
          )}
        </div>
      )}
    </div>
  );
}
