/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../services/geminiService";
import { DotmSquare11 } from "./ui/dotm-square-11";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, modelName: string, isDeepSearch: boolean) => void;
  isLoading: boolean;
  title?: string;
}

const MODELS = [
  "LongCat-2.0-Preview",
  "LongCat-Flash-Chat",
  "LongCat-Flash-Thinking",
  "LongCat-Flash-Thinking-2601",
  "LongCat-Flash-Lite",
  "LongCat-Flash-Omni-2603",
  "LongCat-Flash-Chat-2602-Exp",
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  title,
}) => {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim(), selectedModel, isDeepSearch);
      setInput("");
    }
  };

  return (
    <div className={`chat-interface flex flex-col min-h-full h-full relative`}>
      <div className="chat-messages flex-1 pt-20 pb-40 space-y-8 overflow-y-auto w-full px-4 sm:px-8 md:px-12 scrollbar-hide max-w-4xl mx-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.role} flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`message-bubble max-w-[85%] text-[14px] leading-[1.6] break-words whitespace-pre-wrap ${msg.role === "user" ? "bg-[#EAE8E3] text-[#292929] rounded-[24px] px-6 py-3 shadow-sm" : "bg-transparent text-[#292929] font-medium px-2 py-2"}`}
            >
              {msg.content}
              {isLoading &&
                index === messages.length - 1 &&
                msg.role === "model" && (
                  <span className="inline-flex ml-2 align-middle">
                    <DotmSquare11 size={14} dotSize={2} speed={1.2} />
                  </span>
                )}
            </div>
            {msg.role === "model" && !isLoading && (
              <div className="flex items-center gap-3 mt-2 px-2 text-black/30">
                <button
                  className="hover:text-black/60 transition-colors"
                  title="Copy"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button
                  className="hover:text-black/60 transition-colors"
                  title="Good response"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </button>
                <button
                  className="hover:text-black/60 transition-colors"
                  title="Bad response"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2" />
                  </svg>
                </button>
                <button
                  className="hover:text-black/60 transition-colors"
                  title="Regenerate"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="chat-message model flex flex-col items-start px-2 py-4 mt-2 ml-4">
            <span className="inline-flex text-black/50">
              <DotmSquare11 size={24} dotSize={3} speed={1.2} />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Chat Input form */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none bg-gradient-to-t from-[#F4F3ED] via-[#F4F3ED]/90 to-transparent pt-20">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col p-3 bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.04] w-full"
          >
            <div className="flex items-center px-1 mb-2 relative">
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                className="flex items-center gap-1.5 bg-transparent text-black/40 hover:text-black/70 text-xs font-semibold focus:outline-none cursor-pointer transition-colors"
              >
                {selectedModel}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              
              {isModelSelectorOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelSelectorOpen(false)}></div>
                  <div className="absolute bottom-full left-0 mb-2 w-[220px] bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 p-1.5 z-50">
                    <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto scrollbar-hide py-1">
                      {MODELS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m);
                            setIsModelSelectorOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-[10px] text-xs font-medium text-left transition-colors ${selectedModel === m ? 'bg-black/5 text-black' : 'text-black/60 hover:bg-black/5 hover:text-black'}`}
                        >
                          {m}
                          {selectedModel === m && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black/70"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything"
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-2 text-[15px] font-medium text-black placeholder:text-black/30 placeholder:font-medium"
              disabled={isLoading}
              aria-label={"Chat input"}
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-black/40 hover:bg-black/5 rounded-full transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeepSearch(!isDeepSearch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${isDeepSearch ? 'bg-[#FFD700]/20 text-[#B8860B] border border-[#FFD700]/50' : 'bg-black/5 hover:bg-black/10 text-black/70 border border-transparent'}`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Deep Search
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-full text-xs font-semibold text-black/70 transition-colors border border-black/5"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Reason
                </button>
                <button
                  type="button"
                  className="p-1 px-2 text-black/40 hover:bg-black/5 rounded-full transition-colors flex items-center justify-center"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
              </div>
              <button
                type="submit"
                className="h-8 w-8 bg-[#292929] text-white rounded-[10px] hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center shrink-0 shadow-sm"
                disabled={isLoading || !input.trim()}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5" />
                  <path d="M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </form>
          <div className="text-center mt-3 text-[11px] font-medium text-black/30">
            AI can make mistakes. Please double-check responses.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
