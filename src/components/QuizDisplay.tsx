/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import { Quiz, QuizQuestion } from '../services/geminiService';

interface QuizDisplayProps {
  quiz: Quiz;
}

const QuizQuestionDisplay: React.FC<{ question: QuizQuestion }> = ({ question }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const options = useMemo(() => {
    // Ensure the correct answer is always included in the options, then shuffle
    const allOptions = [...new Set([...question.options, question.answer])];
    return allOptions.sort(() => Math.random() - 0.5);
  }, [question]);

  return (
    <div className="quiz-question-card">
      <p>{question.question}</p>
      <ul className="quiz-options">
        {options.map((option, index) => (
          <li 
            key={index}
            className={showAnswer && option === question.answer ? 'correct-answer' : ''}
          >
            {option}
          </li>
        ))}
      </ul>
      <button onClick={() => setShowAnswer(!showAnswer)} className="show-answer-btn">
        {showAnswer ? 'Hide Answer' : 'Show Answer'}
      </button>
    </div>
  );
};

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz }) => {
  return (
    <div className="quiz-container">
      <h4>{quiz.title}</h4>
      {quiz.questions.map((q, index) => (
        <QuizQuestionDisplay key={index} question={q} />
      ))}
    </div>
  );
};

export default QuizDisplay;
