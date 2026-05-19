import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface PromptInputBoxProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const PromptInputBox: React.FC<PromptInputBoxProps> = ({
  onSend,
  isLoading,
  placeholder = "Type a message...",
  className = ""
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 p-2 bg-background border border-border rounded-full shadow-sm ${className}`}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="p-2 bg-foreground text-background rounded-full disabled:opacity-50 transition-opacity flex items-center justify-center"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
