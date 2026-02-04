// Types matching the daemon-engine gateway API surface

export interface HealthResponse {
  status: "healthy";
  version: string;
  uptime: number;
}

export interface MessageRequest {
  sessionKey: string;
  message: string;
}

export interface MessageResponse {
  status: "ok";
  response: string;
  sessionKey: string;
}

export interface SessionResetRequest {
  sessionKey: string;
}

export interface SessionResetResponse {
  status: "ok";
  message: string;
  sessionKey: string;
}

// SSE stream event types (from /stream endpoint)
export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; output: string }
  | { type: "done"; sessionId: string; usage: TokenUsage; durationMs: number }
  | { type: "error"; message: string };

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

// UI-level message representation
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  streaming?: boolean;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  durationMs?: number;
  sessionId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
  output?: string;
  expanded?: boolean;
}

// Session metadata (mirrors daemon-engine's SessionMetadata)
export interface SessionInfo {
  sessionKey: string;
  created: number;
  lastActive: number;
  claudeSessionId?: string;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalCacheReadTokens?: number;
  messageCount?: number;
}
