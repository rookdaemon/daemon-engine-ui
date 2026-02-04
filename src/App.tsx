import type { DetailedMessage } from './types';
import { ChatView } from './components/ChatView';
import './App.css';

// Mock data for demonstration
const mockMessages: DetailedMessage[] = [
  {
    role: "user",
    content: "Can you read my MEMORY.md file and tell me what tasks I have pending?",
    timestamp: Date.now() - 180000,
  },
  {
    role: "assistant",
    content: "I'll read your MEMORY.md file to check for pending tasks.\n\nBased on the file, you have 3 pending tasks:\n1. Implement the layered output view\n2. Add syntax highlighting for code blocks\n3. Create the token usage display",
    toolCalls: [
      {
        id: "call_1",
        name: "read_file",
        input: {
          file_path: "/home/rook/.openclaw/workspace/MEMORY.md"
        },
        result: "# MEMORY\n\n## Pending Tasks\n- [ ] Implement the layered output view\n- [ ] Add syntax highlighting for code blocks\n- [ ] Create the token usage display\n\n## Completed\n- [x] Set up project structure\n- [x] Create types and interfaces"
      }
    ],
    usage: {
      inputTokens: 1250,
      outputTokens: 450,
      cacheReadTokens: 2100,
    },
    durationMs: 2340,
    timestamp: Date.now() - 120000,
  },
  {
    role: "user",
    content: "Great! Can you also check the current implementation status?",
    timestamp: Date.now() - 60000,
  },
  {
    role: "assistant",
    content: "I've checked the implementation files. The layered output view is partially complete with the Message component created, but we still need to integrate it with the daemon-engine API and add real-time streaming support.",
    toolCalls: [
      {
        id: "call_2",
        name: "list_files",
        input: {
          directory: "/home/rook/.openclaw/workspace/src/components"
        },
        result: "Message.tsx\nMessage.css\nToolCallCard.tsx\nToolCallCard.css\nCodeBlock.tsx\nCodeBlock.css\nChatView.tsx\nChatView.css"
      },
      {
        id: "call_3",
        name: "read_file",
        input: {
          file_path: "/home/rook/.openclaw/workspace/src/components/Message.tsx"
        },
        result: "import { useState } from 'react';\nimport { DetailedMessage } from '../types';\n\nexport function Message({ message }: { message: DetailedMessage }) {\n  const [expanded, setExpanded] = useState(false);\n  // ... implementation details\n  return (\n    <div className=\"message\">\n      {/* Message content */}\n    </div>\n  );\n}"
      }
    ],
    usage: {
      inputTokens: 2100,
      outputTokens: 680,
      cacheReadTokens: 3200,
    },
    durationMs: 3520,
    timestamp: Date.now() - 30000,
  },
];

function App() {
  return (
    <div className="app">
      <ChatView messages={mockMessages} />
    </div>
  );
}

export default App;
