/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';

export type TransformAction = 'explain' | 'perspective' | 'metaphysical';

interface SelectionActionPopupProps {
  position: { x: number; y: number };
  onSelectAction: (action: TransformAction) => void;
  onClose: () => void;
  isLoading: boolean;
  result?: string | null;
}

const SelectionActionPopup: React.FC<SelectionActionPopupProps> = ({ 
  position, 
  onSelectAction, 
  onClose,
  isLoading,
  result
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    transform: 'translate(-50%, 12px)', // Position below the sentence
    zIndex: 1100,
    maxWidth: '400px',
    width: 'max-content',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  return (
    <div ref={popupRef} style={style} className="selection-action-popup">
      {isLoading ? (
        <div className="popup-loader text-sm text-muted-foreground">Analyzing...</div>
      ) : result ? (
        <div className="text-sm leading-relaxed max-h-[300px] overflow-y-auto">
          {result}
        </div>
      ) : (
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors" onClick={() => onSelectAction('explain')}>Explain</button>
          <button className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors" onClick={() => onSelectAction('perspective')}>New Perspective</button>
          <button className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors" onClick={() => onSelectAction('metaphysical')}>Metaphysical Angle</button>
        </div>
      )}
    </div>
  );
};

export default SelectionActionPopup;