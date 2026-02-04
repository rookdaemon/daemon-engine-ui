# Copilot Instructions for daemon-engine-ui

## Project Overview
This is a React + TypeScript + Vite web UI for [daemon-engine](https://github.com/rookdaemon/daemon-engine), an agent-oriented runtime. The UI provides chat, streaming, tool call inspection, and diagnostics.

## Tech Stack
- React 19, TypeScript, Vite
- Tailwind CSS v4 (imported via `@import "tailwindcss"` in index.css, NOT v3-style config)
- No component library. Plain React components.
- Dark theme: zinc-950 base, indigo accents.

## Daemon-Engine API Surface

The backend is daemon-engine's HTTP gateway. The Vite dev proxy rewrites `/api/*` to `http://localhost:8080/*`.

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Returns `{ status, uptime, version }` |
| `POST` | `/message` | Bearer token | Send message, get response. Body: `{ sessionKey, message }`. Returns `{ status, response, sessionKey }` |
| `POST` | `/stream` | Bearer token | SSE streaming. Body: `{ sessionKey, message }`. Events: `token`, `tool_call`, `tool_result`, `done`, `error` |
| `POST` | `/session/reset` | Bearer token | Reset session. Body: `{ sessionKey }`. Returns `{ status, message, sessionKey }` |
| `POST` | `/hooks` | Bearer token | Webhook ingestion (external services). Body: `{ type, payload }`. Not used by UI. |

**There is NO `GET /sessions` endpoint.** The gateway does not list sessions. Session keys are configured client-side via `VITE_SESSION_KEYS` env var (comma-separated, e.g. `webchat:main,heartbeat:default`).

**There is NO `GET /session/:key` metadata endpoint.** Session metadata (token counts, claudeSessionId, etc.) is tracked internally by the gateway but not exposed via API yet. The UI tracks what it can from SSE `done` events (which include `sessionId` and `usage`).

### Authentication
All mutating endpoints require `Authorization: Bearer <token>` header. The token matches the hook configuration in daemon-engine's `daemon.yaml`.

### SSE Stream Events
```typescript
type StreamEvent =
  | { type: "token"; text: string }
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; output: string }
  | { type: "done"; sessionId: string; usage: TokenUsage; durationMs: number }
  | { type: "error"; message: string };
```

## Existing Code Structure

```
src/
  api/client.ts          # Typed fetch wrapper for all endpoints
  types/api.ts           # All shared TypeScript types
  hooks/useChat.ts       # Chat state + SSE streaming logic
  hooks/useHealth.ts     # Health polling hook
  components/
    ChatInput.tsx         # Multi-line input with send/stop
    MessageList.tsx       # Message bubbles with auto-scroll
    ToolCallDetail.tsx    # Expandable tool call inspection
    StatusBar.tsx         # Health, context budget, session info
  App.tsx                 # Main layout (sidebar placeholder + chat area)
  index.css              # Tailwind + custom scrollbar styles
```

## Important Constraints

1. **Do NOT invent API endpoints.** Only use endpoints listed above. If you need data the API doesn't provide, implement it client-side or note it as a limitation.
2. **Build against `main` branch.** All previous Copilot branches are stale. Start fresh from main.
3. **Session keys are client-side configured**, not fetched from backend. Read from `VITE_SESSION_KEYS` env var or `.env`.
4. **Use existing types from `src/types/api.ts`** rather than creating duplicates.
5. **Use existing API client from `src/api/client.ts`** rather than writing new fetch calls.
6. **Dark theme**: maintain zinc-950 background, indigo accents. Don't introduce light mode.
7. **Run `npm run build`** before marking PR ready. Fix any TypeScript or lint errors.

## Open Issues

- **#5**: Session sidebar (list, switch, inspect sessions). Use `VITE_SESSION_KEYS` for session list. Track metadata from SSE `done` events.
