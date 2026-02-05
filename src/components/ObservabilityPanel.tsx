import { useCallback, useEffect, useState } from "react";
import { getStatus, getLogs, runDiagnostic } from "../api/client.ts";
import type {
  StatusResponse,
  LogsResponse,
  DiagnosticResponse,
} from "../types/api.ts";
import { JsonSyntax } from "../utils/syntax.tsx";

interface Props {
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "status" | "logs" | "diagnostics";

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString();
}

export function ObservabilityPanel({ token, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("status");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResponse | null>(
    null
  );
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const s = await getStatus(token);
      setStatus(s);
      setStatusError(null);
    } catch (err) {
      setStatusError((err as Error).message);
      setStatus(null);
    }
  }, [token]);

  const loadLogs = useCallback(async () => {
    try {
      const l = await getLogs(token, 100);
      setLogs(l);
      setLogsError(null);
    } catch (err) {
      setLogsError((err as Error).message);
      setLogs(null);
    }
  }, [token]);

  const loadDiagnostics = useCallback(async () => {
    setLoadingDiagnostics(true);
    setDiagnosticsError(null);
    try {
      const d = await runDiagnostic(token);
      setDiagnostics(d);
    } catch (err) {
      setDiagnosticsError((err as Error).message);
      setDiagnostics(null);
    } finally {
      setLoadingDiagnostics(false);
    }
  }, [token]);

  // Load status on mount and when tab changes
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "status") {
      loadStatus();
      const interval = setInterval(loadStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, loadStatus]);

  // Load logs when logs tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== "logs") return;
    loadLogs();
    if (logsAutoRefresh) {
      const interval = setInterval(loadLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, logsAutoRefresh, loadLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h2 className="text-sm font-bold text-zinc-200">Observability</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700">
          {(["status", "logs", "diagnostics"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "status" && (
            <div className="space-y-4">
              {statusError ? (
                <div className="text-red-400 text-sm">{statusError}</div>
              ) : status ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-500">Status:</span>{" "}
                    <span className="text-green-400">{status.status}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Model:</span>{" "}
                    <span className="text-zinc-200 font-mono">
                      {status.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Version:</span>{" "}
                    <span className="text-zinc-200">{status.version}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Uptime:</span>{" "}
                    <span className="text-zinc-200">
                      {formatUptime(status.uptime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Start Time:</span>{" "}
                    <span className="text-zinc-200">
                      {formatTimestamp(status.startTime)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={loadLogs}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Refresh
                </button>
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                  <input
                    type="checkbox"
                    checked={logsAutoRefresh}
                    onChange={(e) => setLogsAutoRefresh(e.target.checked)}
                  />
                  Auto-refresh
                </label>
              </div>
              {logsError ? (
                <div className="text-red-400 text-sm">{logsError}</div>
              ) : logs ? (
                <div className="space-y-1 font-mono text-xs">
                  {logs.logs.length === 0 ? (
                    <div className="text-zinc-500">No logs available</div>
                  ) : (
                    logs.logs.map((log, i) => (
                      <div
                        key={i}
                        className="p-2 bg-zinc-800 rounded border border-zinc-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-zinc-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              log.level === "error"
                                ? "bg-red-500/20 text-red-400"
                                : log.level === "warn"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-zinc-600">{log.category}</span>
                        </div>
                        <div className="text-zinc-300">{log.message}</div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">Loading...</div>
              )}
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div className="space-y-3">
              <button
                onClick={loadDiagnostics}
                disabled={loadingDiagnostics}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-sm rounded transition-colors"
              >
                {loadingDiagnostics ? "Running..." : "Run Diagnostics"}
              </button>
              {diagnosticsError ? (
                <div className="text-red-400 text-sm">{diagnosticsError}</div>
              ) : diagnostics ? (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500">
                    Timestamp: {formatTimestamp(diagnostics.timestamp)}
                  </div>
                  <div className="bg-zinc-800 p-3 rounded border border-zinc-700 overflow-x-auto">
                    <JsonSyntax json={diagnostics.checks} className="text-zinc-300" />
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">
                  Click "Run Diagnostics" to check system status
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
