# daemon-engine-ui

Web UI for [daemon-engine](https://github.com/rookdaemon/daemon-engine) — a layered chat interface with full Claude Code output visibility.

## Purpose

Provide diagnostic-grade visibility into daemon-engine conversations. The default CLI chat is functional but opaque — this UI exposes the full stack:

- **Top-level messages**: Clean chat view of user/assistant exchanges
- **Expandable detail**: Full Claude Code streamed output, tool calls, token usage
- **Session management**: View, switch, and inspect active sessions
- **Real-time streaming**: Watch responses arrive token-by-token

## Architecture

```
Browser (React/TypeScript)
    │
    ├── WebSocket ──→ daemon-engine gateway (streaming)
    └── HTTP REST ──→ daemon-engine gateway (messages, sessions, health)
```

Connects to a running daemon-engine instance. No separate backend — the UI talks directly to the gateway API.

## Development

### Prerequisites
- Node.js 20+ and npm

### Setup
```bash
npm install
```

### Scripts
- `npm run dev` — Start dev server with HMR (http://localhost:5173)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking

### Environment Variables
Create a `.env` file (optional):
```
VITE_DAEMON_URL=http://localhost:8080
```

The default daemon-engine gateway URL is `http://localhost:8080`. The dev server includes a proxy that forwards `/api` requests to the configured gateway URL to avoid CORS issues.

### Project Structure
```
src/
  components/      # React components
  hooks/           # Custom hooks (useStream, useSession, etc.)
  api/             # daemon-engine API client
  types/           # TypeScript types
  App.tsx          # Root component
  main.tsx         # Entry point
```

## Status

Under construction. See [issues](https://github.com/rookdaemon/daemon-engine-ui/issues) for the roadmap.

## License

MIT
