import { useState } from "react";
import { FaChevronDown, FaChevronRight, FaWrench } from "react-icons/fa";
import type { ToolCall } from "../types";
import { CodeBlock } from "./CodeBlock";
import "./ToolCallCard.css";

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [inputExpanded, setInputExpanded] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(false);

  const formatInput = () => {
    return JSON.stringify(toolCall.input, null, 2);
  };

  const formatResult = () => {
    if (!toolCall.result) return null;
    
    // Show first 5 lines by default when collapsed
    const lines = toolCall.result.split('\n');
    if (!resultExpanded && lines.length > 5) {
      return lines.slice(0, 5).join('\n') + '\n...';
    }
    return toolCall.result;
  };

  return (
    <div className="tool-call-card">
      <div className="tool-call-header">
        <FaWrench className="tool-icon" />
        <span className="tool-name">{toolCall.name}</span>
      </div>

      <div className="tool-call-section">
        <button
          className="section-toggle"
          onClick={() => setInputExpanded(!inputExpanded)}
        >
          {inputExpanded ? <FaChevronDown /> : <FaChevronRight />}
          <span>Input</span>
        </button>
        {inputExpanded && (
          <div className="section-content">
            <CodeBlock code={formatInput()} language="json" />
          </div>
        )}
      </div>

      {toolCall.result && (
        <div className="tool-call-section">
          <button
            className="section-toggle"
            onClick={() => setResultExpanded(!resultExpanded)}
          >
            {resultExpanded ? <FaChevronDown /> : <FaChevronRight />}
            <span>Result</span>
          </button>
          {resultExpanded ? (
            <div className="section-content">
              <CodeBlock code={toolCall.result} language="text" />
            </div>
          ) : (
            <div className="section-content section-preview">
              <CodeBlock code={formatResult() || ""} language="text" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
