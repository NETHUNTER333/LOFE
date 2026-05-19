/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

type ActionType = 'full' | 'summary' | 'cot' | 'quiz' | 'flashcards' | 'books' | 'debate' | 'mindmap' | 'pdf';

interface ActionPopupProps {
  onSelect: (action: ActionType) => void;
}

const ActionPopup: React.FC<ActionPopupProps> = ({ onSelect }) => {
  return (
    <div className="action-popup">
      <button onClick={() => onSelect('full')}>Full Article</button>
      <button onClick={() => onSelect('pdf')}>View PDF</button>
      <button onClick={() => onSelect('summary')}>Summarize</button>
      <button onClick={() => onSelect('cot')}>Chain-of-Thought</button>
      <button onClick={() => onSelect('mindmap')}>Mind Map</button>
      <button onClick={() => onSelect('debate')}>Debate an Issue</button>
      <button onClick={() => onSelect('quiz')}>Take a Quiz</button>
      <button onClick={() => onSelect('flashcards')}>Flashcards</button>
      <button onClick={() => onSelect('books')}>Find Books</button>
    </div>
  );
};

export default ActionPopup;