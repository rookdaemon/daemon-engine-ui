/**
 * Syntax highlighting utilities for JSON and code blocks
 */

export interface JsonSyntaxProps {
  json: string | unknown;
  className?: string;
}

/**
 * Component that renders JSON with syntax highlighting
 */
export function JsonSyntax({ json, className = "" }: JsonSyntaxProps) {
  const jsonString = typeof json === "string" ? json : JSON.stringify(json, null, 2);
  
  // Simple regex-based syntax highlighting
  const highlighted = jsonString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // String values
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="text-sky-400">$1</span>:')
    // String content (not keys)
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-emerald-400">$1</span>')
    // Numbers
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="text-amber-400">$1</span>')
    // Booleans and null
    .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>');

  return (
    <pre 
      className={`font-mono text-xs ${className}`}
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

/**
 * Renders a code block with monospace font and appropriate styling
 */
export interface CodeBlockProps {
  code: string;
  className?: string;
  language?: string;
}

export function CodeBlock({ code, className = "", language }: CodeBlockProps) {
  if (language === "json") {
    try {
      const parsed = JSON.parse(code);
      return <JsonSyntax json={parsed} className={className} />;
    } catch {
      // If JSON parsing fails, fall back to plain text
    }
  }

  return (
    <pre className={`font-mono text-xs whitespace-pre-wrap break-words ${className}`}>
      {code}
    </pre>
  );
}
