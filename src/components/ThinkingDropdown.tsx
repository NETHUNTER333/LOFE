import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThinkingDropdownProps {
  thoughts: string;
  duration: number; // in seconds
  isThinking: boolean;
}

const ThinkingDropdown: React.FC<ThinkingDropdownProps> = ({ thoughts, duration, isThinking }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!thoughts && !isThinking) return null;

  return (
    <div className="thinking-dropdown-container">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="thinking-toggle"
        aria-expanded={isOpen}
      >
        <div className="thinking-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="thinking-icon">
            <path d="M12 4V20M4 12H20M17 7L7 17M7 7L17 17" stroke="url(#thinking-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="thinking-gradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4285F4" />
                <stop offset="1" stopColor="#9B72CB" />
              </linearGradient>
            </defs>
          </svg>
          <span className="thinking-label">
            {isThinking ? 'Thinking...' : `Thought for ${duration.toFixed(1)} seconds`}
          </span>
        </div>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`thinking-chevron ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="thinking-content-wrapper"
          >
            <div className="thinking-content">
              {thoughts}
              {isThinking && <span className="thinking-cursor">|</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingDropdown;
