/**
 * Token usage statistics for a message
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
}

/**
 * A single tool call made by the assistant
 */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
}

/**
 * A detailed message with full diagnostic information
 */
export interface DetailedMessage {
  role: "user" | "assistant";
  content: string;           // Final text
  toolCalls?: ToolCall[];    // Tool invocations
  usage?: TokenUsage;        // Token counts
  durationMs?: number;       // Response time
  timestamp: number;
}
