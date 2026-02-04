import { useCallback, useState } from "react";
import type { ToolCall } from "../types/api.ts";

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
        <div key={tc.id} className="border border-zinc-700 rounded text-xs">
          <button
            onClick={() => toggle(tc.id)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-800 transition-colors"
          >
            <span
              className={`transition-transform ${expanded[tc.id] ? "rotate-90" : ""}`}
            >
              &#9654;
            </span>
            <span className="text-indigo-400 font-mono">{tc.name}</span>
            {tc.output !== undefined ? (
              <span className="text-green-400 ml-auto">done</span>
            ) : (
              <span className="text-yellow-400 ml-auto animate-pulse">
                running
              </span>
            )}
          </button>
          {expanded[tc.id] && (
            <div className="border-t border-zinc-700 px-3 py-2 space-y-2">
              <div>
                <div className="text-zinc-500 mb-1">Input</div>
                <pre className="bg-zinc-950 p-2 rounded overflow-x-auto text-zinc-300 whitespace-pre-wrap break-words">
                  {typeof tc.input === "string"
                    ? tc.input
                    : JSON.stringify(tc.input, null, 2)}
                </pre>
              </div>
              {tc.output !== undefined && (
                <div>
                  <div className="text-zinc-500 mb-1">Output</div>
                  <pre className="bg-zinc-950 p-2 rounded overflow-x-auto text-zinc-300 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
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
