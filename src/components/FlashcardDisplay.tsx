/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { Flashcard } from '../services/geminiService';

interface FlashcardDisplayProps {
  flashcards: Flashcard[];
  topic: string;
}

const SingleFlashcard: React.FC<{ card: Flashcard }> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const dragThreshold = 5; // pixels

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    
    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);

    if (dx > dragThreshold || dy > dragThreshold) {
      isDragging.current = true;
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!isDragging.current) {
      setIsFlipped(prev => !prev);
    }
  };

  return (
    <div 
        className="flashcard-perspective"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'pan-y' }} // Allow vertical scroll on touch
        role="button"
        tabIndex={0}
        aria-label={`Flashcard: ${card.question}. Click to see the answer.`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsFlipped(!isFlipped); }}
    >
      <div className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}>
        <div className="flashcard-face flashcard-front">
          <p className="flashcard-question">{card.question}</p>
          <span className="flashcard-instruction">Click to flip</span>
        </div>
        <div className="flashcard-face flashcard-back">
          <p className="flashcard-answer">{card.answer}</p>
        </div>
      </div>
    </div>
  );
};

const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({ flashcards, topic }) => {
  return (
    <div className="flashcard-container">
      <h4>Flashcards for {topic}</h4>
      <div className="flashcard-grid">
        {flashcards.map((card, index) => (
          <SingleFlashcard key={index} card={card} />
        ))}
      </div>
    </div>
  );
};

export default FlashcardDisplay;