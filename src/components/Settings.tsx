/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

export type Theme = 'paper' | 'nature' | 'science' | 'classic' | 'desert' | 'newspaper' | 'retro' | 'archaic' | 'halftone' | 'modern_news' | 'classic_news';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isMemoryEnabled: boolean;
  onMemoryToggle: (enabled: boolean) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const THEMES: { id: Theme; name: string; colors: string[] }[] = [
  { id: 'paper', name: 'Paper', colors: ['#ffffff', '#202020'] },
  { id: 'nature', name: 'Nature', colors: ['#fdfdfb', '#2d5a27'] },
  { id: 'science', name: 'Science', colors: ['#ffffff', '#004a99'] },
  { id: 'classic', name: 'Classic', colors: ['#f4f1ea', '#8b0000'] },
  { id: 'desert', name: 'Desert', colors: ['#fdf2d1', '#d97706'] },
  { id: 'newspaper', name: 'The Post', colors: ['#fcfaf6', '#1c1917'] },
  { id: 'retro', name: 'Archived', colors: ['#ebd5b3', '#3e2723'] },
  { id: 'archaic', name: 'Paperio', colors: ['#dfd8c8', '#111111'] },
  { id: 'halftone', name: 'Halftone', colors: ['#ff007f', '#000000'] },
  { id: 'modern_news', name: 'Maple News', colors: ['#f9f6f0', '#b91c1c'] },
  { id: 'classic_news', name: 'Daily News', colors: ['#f5f0e1', '#c53030'] },
];

const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  isMemoryEnabled,
  onMemoryToggle,
  currentTheme,
  onThemeChange
}) => {
  return (
    <>
      <div 
        className={`settings-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`settings-panel ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="settings-header">
          <h3 id="settings-title">Settings</h3>
          <button onClick={onClose} className="close-settings" aria-label="Close settings">
            &times;
          </button>
        </div>
        
        <div className="settings-group">
          <h4>Appearance</h4>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${currentTheme === theme.id ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-border hover:border-border/60 hover:bg-muted/5'}`}
              >
                <div 
                  className="w-10 h-10 rounded-xl overflow-hidden flex flex-col shadow-sm border border-black/5"
                  style={{ background: theme.colors[0] }}
                >
                  <div className="flex-1" />
                  <div className="h-4 w-full" style={{ background: theme.colors[1] }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold m-0">{theme.name}</p>
                </div>
                {currentTheme === theme.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <h4>Profile & Account</h4>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                U
              </div>
              <div>
                <p className="font-medium text-foreground">User Account</p>
                <p className="text-sm text-muted-foreground">user@example.com</p>
              </div>
            </div>
            <button className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium mt-2">
              Manage Account
            </button>
            <button className="w-full py-2 px-4 border border-destructive/30 text-destructive rounded-md hover:bg-destructive/10 transition-colors text-sm font-medium">
              Sign Out
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h4>Conversation</h4>
          <div className="toggle-switch">
            <span>Memory (Chat History)</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isMemoryEnabled} 
                onChange={(e) => onMemoryToggle(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;