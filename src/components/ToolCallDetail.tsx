import { useCallback, useState } from "react";
import type { ToolCall } from "../types/api.ts";
import { JsonSyntax } from "../utils/syntax.tsx";

interface Props {
  toolCalls: ToolCall[];
}

export function ToolCallDetail({ toolCalls }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (toolCalls.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {toolCalls.map((tc) => (
        <div key={tc.id} className="border border-emerald-900/50 bg-emerald-950/20 rounded text-xs">
          <button
            onClick={() => toggle(tc.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-emerald-900/20 transition-colors"
          >
            <span
              className={`transition-transform ${expanded[tc.id] ? "rotate-90" : ""}`}
            >
              &#9654;
            </span>
            <span className="text-emerald-400 font-mono">{tc.name}</span>
            {tc.output !== undefined ? (
              <span className="text-emerald-500 ml-auto">done</span>
            ) : (
              <span className="text-yellow-400 ml-auto animate-pulse">
                running
              </span>
            )}
          </button>
          {expanded[tc.id] && (
            <div className="border-t border-emerald-900/50 px-3 py-2 space-y-2">
              <div>
                <div className="text-zinc-500 mb-1">Input</div>
                <div className="bg-zinc-950 p-2 rounded overflow-x-auto">
                  <JsonSyntax json={tc.input} className="text-zinc-300" />
                </div>
              </div>
              {tc.output !== undefined && (
                <div>
                  <div className="text-zinc-500 mb-1">Output</div>
                  <pre className="bg-zinc-950 p-2 rounded overflow-x-auto text-zinc-300 font-mono text-xs whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                    {tc.output}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
