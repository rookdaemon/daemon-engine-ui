import type { Message, SendMessageRequest, SendMessageResponse, StreamChunk } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';

export class ApiClient {
  private baseUrl: string;
  private wsBaseUrl: string;

  constructor(baseUrl = API_BASE_URL, wsBaseUrl = WS_BASE_URL) {
    this.baseUrl = baseUrl;
    this.wsBaseUrl = wsBaseUrl;
  }

  async getMessages(sessionKey: string): Promise<Message[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionKey}/messages`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch messages for session '${sessionKey}': ${response.statusText}`);
      }
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    
    return response.json();
  }

  createStreamConnection(
    sessionKey: string,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void,
    onClose?: () => void
  ): WebSocket {
    const ws = new WebSocket(`${this.wsBaseUrl}/stream?session=${sessionKey}`);

    ws.onmessage = (event) => {
      try {
        const chunk: StreamChunk = JSON.parse(event.data);
        onChunk(chunk);
      } catch (error) {
        console.error('Failed to parse stream chunk:', error);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      if (onError) {
        onError(new Error('WebSocket connection error'));
      }
    };

    ws.onclose = () => {
      if (onClose) {
        onClose();
      }
    };

    return ws;
  }
}

export const apiClient = new ApiClient();
