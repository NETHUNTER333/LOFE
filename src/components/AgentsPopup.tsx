/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';

export interface AgentProfile {
  id: string;
  name: string;
  title: string;
  description: string;
  systemInstruction: string;
}

interface AgentsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentProfile[];
  onAgentSelect: (agent: AgentProfile) => void;
  currentAgentId: string;
}

const AgentsPopup: React.FC<AgentsPopupProps> = ({ 
  isOpen, 
  onClose, 
  agents,
  onAgentSelect,
  currentAgentId
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isInitialLoad = useRef(true);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  // Drag state
  const [dragState, setDragState] = useState({
    isDragging: false,
    startPos: 0,
    dragOffset: 0,
  });

  useEffect(() => {
    const initialIndex = agents.findIndex(a => a.id === currentAgentId);
    if (initialIndex !== -1) {
      setActiveIndex(initialIndex);
    }
  }, [currentAgentId, agents]);
  
  useEffect(() => {
      if (isOpen) {
          isInitialLoad.current = true;
          const timer = setTimeout(() => {
              isInitialLoad.current = false;
          }, 500);
          return () => clearTimeout(timer);
      } else {
        setDragState({ isDragging: false, startPos: 0, dragOffset: 0 });
      }
  }, [isOpen]);

  const handlePrev = () => {
    if (isInitialLoad.current) return;
    setExitDirection('right');
    setTimeout(() => {
        setActiveIndex(prev => (prev === 0 ? agents.length - 1 : prev - 1));
        setExitDirection(null);
    }, 50);
  };
  
  const handleNext = () => {
    if (isInitialLoad.current) return;
    setExitDirection('left');
     setTimeout(() => {
        setActiveIndex(prev => (prev === agents.length - 1 ? 0 : prev + 1));
        setExitDirection(null);
    }, 50);
  };

  // --- Drag Handlers ---
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isInitialLoad.current || dragState.isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragState({
      isDragging: true,
      startPos: clientX,
      dragOffset: 0,
    });
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    let clientX: number;
    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else {
        return; 
      }
    } else {
      clientX = e.clientX;
    }
    setDragState(prev => ({
      ...prev,
      dragOffset: clientX - prev.startPos,
    }));
  };

  const handleDragEnd = () => {
    if (!dragState.isDragging) return;
    const swipeThreshold = 75; // Min pixels to be considered a swipe
    if (Math.abs(dragState.dragOffset) > swipeThreshold) {
      if (dragState.dragOffset < 0) { // Swiped left
        handleNext();
      } else { // Swiped right
        handlePrev();
      }
    }
    setDragState({ isDragging: false, startPos: 0, dragOffset: 0 });
  };
  // --- End Drag Handlers ---

  const getCardClass = (index: number, active: number, total: number) => {
    if (isInitialLoad.current) {
      if (index === active) return 'active';
      if (index === (active + 1) % total) return 'next';
      if (index === (active + 2) % total) return 'second-next';
      return 'hidden-stack';
    }
    if (exitDirection && index === active) {
      return exitDirection === 'left' ? 'exit-left' : 'exit-right';
    }
    if (index === active) return 'active';
    if (index === (active + 1) % total) return 'next';
    if (index === (active + 2) % total) return 'second-next';
    return 'hidden-stack';
  };
  
  const getCardStyle = (index: number): React.CSSProperties => {
    const baseStyle = { transition: isInitialLoad.current ? 'none' : undefined };
    if (index === activeIndex && dragState.isDragging) {
      return {
        ...baseStyle,
        transform: `translateX(calc(-50% + ${dragState.dragOffset}px)) rotate(${dragState.dragOffset / 20}deg)`,
        transition: 'none',
      };
    }
    return baseStyle;
  };

  return (
    <>
      <div 
        className={`settings-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className={`agents-popup ${isOpen ? 'open' : ''}`} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="agents-title"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="agents-header">
          <h3 id="agents-title">Select an Agent</h3>
          <button onClick={onClose} className="close-agents" aria-label="Close agent selection">
            &times;
          </button>
        </div>
        
        <div className="agents-swiper-wrapper">
            <div className="agents-swiper-container">
                {agents.map((agent, index) => (
                  <div 
                    key={agent.id}
                    className={`agent-card-swiper ${getCardClass(index, activeIndex, agents.length)}`}
                    style={getCardStyle(index)}
                    onMouseDown={index === activeIndex ? handleDragStart : undefined}
                    onTouchStart={index === activeIndex ? handleDragStart : undefined}
                  >
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-title">{agent.title}</div>
                    <p className="agent-description">{agent.description}</p>
                  </div>
                ))}
            </div>
            <div className="agent-swiper-controls">
                <button 
                  onClick={() => onAgentSelect(agents[activeIndex])}
                  className="select-agent-btn"
                >
                  Select This Agent
                </button>
            </div>
        </div>

      </div>
    </>
  );
};

export default AgentsPopup;
