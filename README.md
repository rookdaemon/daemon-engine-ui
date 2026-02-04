# daemon-engine-ui

Web UI for daemon-engine, built with React 19, TypeScript, and Vite.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build/dev server
- **Tailwind CSS** for styling
- **ESLint** for linting
- TypeScript strict mode enabled

## Project Structure

```
src/
  components/      # React components
  hooks/           # Custom hooks (useStream, useSession, etc.)
  api/             # daemon-engine API client
  types/           # TypeScript types
  App.tsx          # Root component
  main.tsx         # Entry point
public/
package.json
tsconfig.json
vite.config.ts
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create a `.env` file (optional):

```bash
VITE_DAEMON_URL=http://localhost:8080
```

The default daemon-engine gateway URL is `http://localhost:8080`.

### Development

Start the dev server with HMR:

```bash
npm run dev
```

The app will be available at http://localhost:5173/

### Build

Production build:

```bash
npm run build
```

### Linting

Run ESLint:

```bash
npm run lint
```

### Type Checking

Run TypeScript type checking:

```bash
npm run typecheck
```

## API Proxy

The Vite dev server is configured to proxy `/api` requests to the daemon-engine gateway (configured via `VITE_DAEMON_URL`) to avoid CORS issues during development.

