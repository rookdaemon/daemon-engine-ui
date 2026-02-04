import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { apiClient } from '../lib/api';
import type { Message } from '../types/api';

interface ChatViewProps {
  sessionKey?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ sessionKey = 'webchat:main' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const loadMessages = async () => {
      const loadedMessages = await apiClient.getMessages(sessionKey);
      setMessages(loadedMessages);
    };

    loadMessages();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionKey]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiClient.sendMessage({
        sessionKey,
        content,
      });

      // Update user message with actual ID
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, id: response.messageId } : msg
        )
      );

      // Start streaming assistant response
      let assistantContent = '';
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      wsRef.current = apiClient.createStreamConnection(
        sessionKey,
        (chunk) => {
          if (chunk.type === 'content' && chunk.content) {
            assistantContent += chunk.content;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
          } else if (chunk.type === 'done') {
            if (wsRef.current) {
              wsRef.current.close();
            }
          } else if (chunk.type === 'error') {
            console.error('Stream error:', chunk.error);
            if (wsRef.current) {
              wsRef.current.close();
            }
          }
        },
        (error) => {
          console.error('WebSocket error:', error);
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-view">
      <div className="messages-container">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
};
