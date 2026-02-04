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

## Status

Under construction. See [issues](https://github.com/rookdaemon/daemon-engine-ui/issues) for the roadmap.

## License

MIT
