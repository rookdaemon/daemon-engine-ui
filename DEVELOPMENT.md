# daemon-engine-ui Development Guide

## Overview

This UI provides diagnostic-grade visibility into daemon-engine conversations with a layered approach to displaying assistant messages.

## Architecture

### Component Structure

```
src/
├── types.ts                 # TypeScript interfaces
├── components/
│   ├── ChatView.tsx        # Main chat container
│   ├── Message.tsx         # Layered message component
│   ├── ToolCallCard.tsx    # Individual tool call display
│   └── CodeBlock.tsx       # Syntax-highlighted code display
└── App.tsx                 # Application root
```

### Data Model

The application uses the following TypeScript interfaces defined in `src/types.ts`:

#### `DetailedMessage`
Represents a complete message with all diagnostic information:
- `role`: "user" | "assistant"
- `content`: Final text response
- `toolCalls?`: Array of tool invocations (optional)
- `usage?`: Token usage statistics (optional)
- `durationMs?`: Response time in milliseconds (optional)
- `timestamp`: Message timestamp

#### `ToolCall`
Represents a single tool invocation:
- `id`: Unique identifier
- `name`: Tool name (e.g., "read_file", "write_file")
- `input`: Tool input parameters as JSON object
- `result?`: Tool output/result (optional)

#### `TokenUsage`
Token consumption statistics:
- `inputTokens`: Input token count
- `outputTokens`: Output token count
- `cacheReadTokens?`: Cache read token count (optional)

## Features

### Layered Message Rendering

Each assistant message has two layers:

**Layer 1 — Summary (default view):**
- Shows only the final text response
- Clean, readable, no clutter
- "Show details" button if diagnostic info available

**Layer 2 — Full detail (expanded):**
- Tool calls with collapsible input/output
- Token usage statistics
- Response duration
- Syntax-highlighted code blocks

### Tool Call Display

Tool calls are displayed as collapsible cards showing:
- 🔧 Tool name and icon
- Collapsible input section (JSON syntax highlighting)
- Collapsible result section (first 5 lines visible by default)
- Syntax highlighting for code in results

### Syntax Highlighting

Uses `prism-react-renderer` with VS Dark theme for:
- JSON formatting (tool inputs)
- Code blocks (tool results)
- Line numbers for easy reference

## Development

### Setup

```bash
npm install
npm run dev
```

The application will start on `http://localhost:5173/`

### Build

```bash
npm run build
```

Builds the production-ready application to `dist/`

### Lint

```bash
npm run lint
```

## Mock Data

Currently the application displays mock data defined in `App.tsx`. The mock includes:

- User messages
- Assistant messages with tool calls
- Multiple tool invocations (read_file, list_files)
- Token usage and duration statistics

### Example Message Structure

```typescript
{
  role: "assistant",
  content: "I'll read your MEMORY.md file...",
  toolCalls: [
    {
      id: "call_1",
      name: "read_file",
      input: {
        file_path: "/home/rook/.openclaw/workspace/MEMORY.md"
      },
      result: "# MEMORY\n\n## Pending Tasks\n..."
    }
  ],
  usage: {
    inputTokens: 1250,
    outputTokens: 450,
    cacheReadTokens: 2100,
  },
  durationMs: 2340,
  timestamp: Date.now()
}
```

## Future Integration

The current implementation uses mock data. To integrate with daemon-engine:

1. **Parse daemon-engine JSON output**: Extract tool calls from Claude CLI `--output-format json`
2. **WebSocket streaming**: Connect to daemon-engine SSE events for real-time updates
3. **API endpoints**: Implement `/message` endpoint integration for fetching historical messages

## Styling

The UI uses a clean, professional design with:
- Monospace fonts for code and technical data
- VS Dark theme for syntax highlighting
- Responsive layout that works on different screen sizes
- Subtle animations for expand/collapse interactions

## Dependencies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **prism-react-renderer**: Syntax highlighting
- **react-icons**: Icon library (Font Awesome)
