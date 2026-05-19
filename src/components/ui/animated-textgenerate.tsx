import React, { useEffect, useState } from 'react';

interface AnimatedTextGenerateProps {
  text: string;
  className?: string;
  textClassName?: string;
  blurEffect?: boolean;
  speed?: number;
  highlightWords?: string[];
  highlightClassName?: string;
  linkWords?: string[];
  linkHrefs?: string[];
  linkClassNames?: string[];
  isStreaming?: boolean;
}

export const AnimatedTextGenerate: React.FC<AnimatedTextGenerateProps> = ({
  text,
  className = "",
  textClassName = "",
  blurEffect = false,
  speed = 1,
  highlightWords = [],
  highlightClassName = "",
  linkWords = [],
  linkHrefs = [],
  linkClassNames = [],
  isStreaming = false
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(text);
  }, [text]);

  const renderText = () => {
    if (!highlightWords.length && !linkWords.length) {
      return displayedText;
    }

    // A very basic implementation that just returns the text for now
    // A robust implementation would split the text by all highlight/link words
    // and render them as spans/a tags.
    return displayedText;
  };

  return (
    <div className={className}>
      <div className={textClassName}>
        {renderText()}
      </div>
    </div>
  );
};

