import { useCallback, useRef, useState } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  onAbort?: () => void;
}

export function ChatInput({ onSend, disabled, onAbort }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, []);

  return (
    <div className="border-t border-zinc-700 bg-zinc-900 p-4">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Send a message..."
          rows={1}
          className="flex-1 resize-none bg-zinc-800 text-zinc-100 rounded-lg px-4 py-3 border border-zinc-600 focus:border-indigo-500 focus:outline-none placeholder-zinc-500 text-sm leading-relaxed"
          disabled={disabled}
        />
        {disabled ? (
          <button
            onClick={onAbort}
            className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
