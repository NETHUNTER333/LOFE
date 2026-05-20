/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { getAutocompleteSuggestions, SearchResult } from '@/services/geminiService';

interface SearchBarProps {
  onSearch: (query: string, modelName: string) => void;
  onSearchResultSelect?: (result: SearchResult) => void;
  onRandom: () => void;
  onDiscover: (modelName: string) => void;
  isLoading: boolean;
  isWebSearchEnabled: boolean;
  onWebSearchToggle: (enabled: boolean) => void;
  isLearningMode: boolean;
  onToggleLearnMode: () => void;
  onAgentsToggle: () => void;
  onChatToggle: () => void;
  onTasksToggle: () => void;
  onSettingsToggle: () => void;
  selectedAgentName: string;
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

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onSearchResultSelect,
  onRandom,
  onDiscover,
  isLoading,
  isWebSearchEnabled,
  onWebSearchToggle,
  isLearningMode,
  onToggleLearnMode,
  onAgentsToggle,
  onChatToggle,
  onTasksToggle,
  onSettingsToggle,
  selectedAgentName,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [selectedModel] = useState(MODELS[0]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const results = await getAutocompleteSuggestions(query);
        setSuggestions(results.slice(0, 5));
        setShowSuggestions(results.length > 0);
      } catch (e) {
        console.error('Failed to fetch suggestions', e);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim(), selectedModel);
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (result: SearchResult) => {
    setQuery('');
    setShowSuggestions(false);
    if (onSearchResultSelect) {
      onSearchResultSelect(result);
    } else {
      onSearch(result.title, selectedModel);
    }
  };

  return (
    <div className="controls-container">
      <div className="flex justify-between items-center mb-4">
        <div className="active-agent-display !mb-0">
          Current Agent: <span>{selectedAgentName}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="search-form relative" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Explore a topic or search articles..."
          className="search-input"
          aria-label="Search for a topic"
          disabled={isLoading}
        />
        {isSearchingSuggestions && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
             <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionRef}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto"
          >
            {suggestions.map((res, index) => (
              <div 
                key={index}
                onClick={() => handleSuggestionClick(res)}
                className="p-4 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0 group"
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-serif font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{res.title}</h4>
                  {res.engine && <span className="text-[10px] uppercase tracking-widest bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{res.engine}</span>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {res.content.replace(/<[^>]*>?/gm, '')}
                </p>
                {res.url && (
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-color mt-1 truncate hover:underline inline-block" onClick={e => e.stopPropagation()}>
                    {res.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </form>
      <div className="newspaper-controls">
          <div className="button-row">
            <button onClick={onRandom} className="control-button" disabled={isLoading}>
              Surprise Me
            </button>
            <button 
              onClick={() => onDiscover(selectedModel)} 
              className="control-button group relative overflow-hidden" 
              disabled={isLoading} 
              title="Generate an AI Research Article"
            >
              <div className="absolute inset-0 bg-[#FFD700] translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-20" />
              <span className="relative z-10 flex items-center gap-1.5">
                Deep Research
              </span>
            </button>
            <button onClick={onChatToggle} className="control-button" disabled={isLoading} title="Chat with AI">
              Chat
            </button>
        </div>
        <div className="button-row">
          <button 
            onClick={onToggleLearnMode} 
            className={`control-button learn-mode-btn ${isLearningMode ? 'active' : ''}`} 
            disabled={isLoading}
          >
            Learn
          </button>
          <button onClick={onAgentsToggle} className="control-button" disabled={isLoading}>
            Agents
          </button>
          <button onClick={onTasksToggle} className="control-button" disabled={isLoading}>
            Tasks
          </button>
          <button onClick={onSettingsToggle} className="control-button" disabled={isLoading}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;