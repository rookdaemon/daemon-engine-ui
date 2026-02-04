import { useState } from "react";
import { FaChevronDown, FaChevronRight, FaClock, FaCoins } from "react-icons/fa";
import type { DetailedMessage } from "../types";
import { ToolCallCard } from "./ToolCallCard";
import "./Message.css";

interface MessageProps {
  message: DetailedMessage;
}

export function Message({ message }: MessageProps) {
  const [expanded, setExpanded] = useState(false);

  const hasDetails = message.role === "assistant" && (
    message.toolCalls?.length || 
    message.usage || 
    message.durationMs
  );

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`message message-${message.role}`}>
      <div className="message-header">
        <div className="message-role">{message.role}</div>
        <div className="message-time">{formatTimestamp(message.timestamp)}</div>
      </div>

      {/* Layer 1: Summary (default view) */}
      <div className="message-content">
        {message.content}
      </div>

      {/* Expand/Collapse Toggle */}
      {hasDetails && (
        <button
          className="expand-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <FaChevronDown /> : <FaChevronRight />}
          <span>{expanded ? "Hide details" : "Show details"}</span>
        </button>
      )}

      {/* Layer 2: Full detail (expanded view) */}
      {expanded && hasDetails && (
        <div className="message-details">
          {/* Tool Calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="details-section">
              <h4 className="details-heading">
                🔧 Tool Calls ({message.toolCalls.length})
              </h4>
              {message.toolCalls.map((toolCall) => (
                <ToolCallCard key={toolCall.id} toolCall={toolCall} />
              ))}
            </div>
          )}

          {/* Token Usage and Duration */}
          <div className="details-section">
            <div className="metadata-grid">
              {message.usage && (
                <div className="metadata-item">
                  <FaCoins className="metadata-icon" />
                  <div className="metadata-content">
                    <div className="metadata-label">Token Usage</div>
                    <div className="metadata-value">
                      Input: {message.usage.inputTokens.toLocaleString()}
                      {" · "}
                      Output: {message.usage.outputTokens.toLocaleString()}
                      {message.usage.cacheReadTokens !== undefined && (
                        <>
                          {" · "}
                          Cache: {message.usage.cacheReadTokens.toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {message.durationMs !== undefined && (
                <div className="metadata-item">
                  <FaClock className="metadata-icon" />
                  <div className="metadata-content">
                    <div className="metadata-label">Duration</div>
                    <div className="metadata-value">
                      {formatDuration(message.durationMs)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
