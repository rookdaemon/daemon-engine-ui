# daemon-engine-ui

Web UI for [daemon-engine](https://github.com/rookdaemon/daemon-engine) — a layered chat interface with full Claude Code output visibility.

## Purpose

Provide diagnostic-grade visibility into daemon-engine conversations. The default CLI chat is functional but opaque — this UI exposes the full stack:

- **Top-level messages**: Clean chat view of user/assistant exchanges
- **Expandable detail**: Full Claude Code streamed output, tool calls, token usage
- **Session management**: View, switch, and inspect active sessions
- **Real-time streaming**: Watch responses arrive token-by-token

## Features

### Layered Message View

Each assistant message has two layers:

**Layer 1 — Summary (default)**
- Clean, readable text response
- No clutter or technical details
- "Show details" button if diagnostic info available

**Layer 2 — Full diagnostic detail (expanded)**
- 🔧 **Tool calls**: Name, input parameters, and results
- 📊 **Token usage**: Input, output, and cache read tokens
- ⏱️ **Duration**: Response time
- 💻 **Syntax highlighting**: Code blocks with line numbers

### Tool Call Cards

Each tool invocation displays as a collapsible card:
- Tool name with icon
- JSON input parameters (collapsible, syntax-highlighted)
- Tool results (collapsible, first 5 lines visible by default)
- Syntax highlighting for code content

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/rookdaemon/daemon-engine-ui.git
cd daemon-engine-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Architecture

```
Browser (React/TypeScript)
    │
    ├── WebSocket ──→ daemon-engine gateway (streaming)
    └── HTTP REST ──→ daemon-engine gateway (messages, sessions, health)
```

Connects to a running daemon-engine instance. No separate backend — the UI talks directly to the gateway API.

## Current Status

✅ **Implemented:**
- Layered message rendering (summary + expandable detail)
- Tool call cards with collapsible input/output
- Syntax highlighting for code blocks
- Token usage and duration display
- Expand/collapse state management
- Mock data demonstration

🚧 **In Progress:**
- WebSocket integration for real-time streaming
- daemon-engine API integration
- Session management
- Message history persistence

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide, component structure, and data models.

## Screenshots

### Default View (Layer 1)
![Collapsed View](https://github.com/user-attachments/assets/e5eb1430-3221-4fd1-bba1-c19b181f4b38)

### Expanded View (Layer 2)
![Expanded View](https://github.com/user-attachments/assets/d0d61b3d-3fbc-4c50-af9c-84a5ef6ed529)

### Full Tool Details
![Full Detail View](https://github.com/user-attachments/assets/d1f53873-8f04-4e34-aa3b-172810d9d954)

## License

MIT

