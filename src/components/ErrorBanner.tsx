interface Props {
  error: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onDismiss }: Props) {
  if (!error) return null;

  const isAuthError = error.toLowerCase().includes("unauthorized") || 
                     error.toLowerCase().includes("no hook configured");

  return (
    <div className={`px-4 py-3 border-b ${
      isAuthError 
        ? "bg-red-950/50 border-red-800 text-red-200" 
        : "bg-yellow-950/50 border-yellow-800 text-yellow-200"
    }`}>
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <div className="flex-1">
          <div className="font-medium text-sm mb-1">
            {isAuthError ? "Authentication Error" : "Error"}
          </div>
          <div className="text-xs font-mono opacity-90">{error}</div>
          {isAuthError && (
            <div className="mt-2 text-xs opacity-75">
              <p className="mb-1">To fix this:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Create a <code className="bg-black/30 px-1 rounded">.env</code> file in the project root</li>
                <li>Add <code className="bg-black/30 px-1 rounded">VITE_DAEMON_TOKEN=your-token-here</code></li>
                <li>Make sure the token matches the one configured in your daemon-engine hooks</li>
                <li>Restart the dev server (<code className="bg-black/30 px-1 rounded">npm run dev</code>)</li>
              </ol>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
