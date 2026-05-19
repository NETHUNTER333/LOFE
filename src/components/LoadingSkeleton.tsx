/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface LoadingSkeletonProps {
  progress?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ progress = 0 }) => {
  const roundedProgress = Math.round(progress);
  
  const barStyle: React.CSSProperties = {
    height: '1.2rem',
    backgroundColor: '#e0e0e0', // A neutral gray that works with the new theme
    marginBottom: '1rem',
    borderRadius: '2px',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div aria-label="Loading content..." role="progressbar" className="animate-pulse">
      <div className="flex justify-between items-end mb-4">
        <div className="space-y-2">
            <h3 className="text-xl font-serif italic text-muted-foreground">Gathering knowledge...</h3>
            <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-mono">Synthesizing multiple perspectives</p>
        </div>
        <div className="text-right">
            <span className="text-4xl font-serif italic text-accent-color">{roundedProgress}%</span>
        </div>
      </div>

      <div className="w-full bg-muted/20 h-1 mb-12 rounded-full overflow-hidden">
        <div 
            className="h-full bg-accent-color transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div style={{ ...barStyle, width: '95%' }}></div>
      <div style={{ ...barStyle, width: '100%' }}></div>
      <div style={{ ...barStyle, width: '85%' }}></div>
      <div style={{ ...barStyle, width: '90%' }}></div>
      <div style={{ ...barStyle, width: '70%' }}></div>
    </div>
  );
};

export default LoadingSkeleton;