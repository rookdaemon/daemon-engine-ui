import type { DetailedMessage } from "../types";
import { Message } from "./Message";
import "./ChatView.css";

interface ChatViewProps {
  messages: DetailedMessage[];
}

export function ChatView({ messages }: ChatViewProps) {
  return (
    <div className="chat-view">
      <div className="chat-header">
        <h2>daemon-engine Chat</h2>
        <p className="chat-subtitle">Diagnostic-grade visibility into Claude Code conversations</p>
      </div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start a conversation to see messages here.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Message key={`${message.timestamp}-${index}`} message={message} />
          ))
        )}
      </div>
    </div>
  );
}
