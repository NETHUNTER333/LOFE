/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { FileText, File, AlignLeft, BrainCircuit, Network, MessageSquare, HelpCircle, Layers, Library } from 'lucide-react';

type ActionType = 'full' | 'summary' | 'cot' | 'quiz' | 'flashcards' | 'books' | 'debate' | 'mindmap' | 'pdf';

interface ActionPopupProps {
  onSelect: (action: ActionType) => void;
  topic: string;
}

const ActionPopup: React.FC<ActionPopupProps> = ({ onSelect, topic }) => {
  const modes = [
    { id: 'summary', label: 'Summarize', icon: <AlignLeft size={18} />, color: 'bg-emerald-500/10 text-emerald-600', description: 'Brief overview' },
    { id: 'full', label: 'Full Article', icon: <FileText size={18} />, color: 'bg-blue-500/10 text-blue-600', description: 'Deep context' },
    { id: 'pdf', label: 'View PDF', icon: <File size={18} />, color: 'bg-red-500/10 text-red-600', description: 'Original doc' },
    { id: 'cot', label: 'Chain-of-Thought', icon: <BrainCircuit size={18} />, color: 'bg-purple-500/10 text-purple-600', description: 'Step-by-step logic' },
    { id: 'mindmap', label: 'Mind Map', icon: <Network size={18} />, color: 'bg-indigo-500/10 text-indigo-600', description: 'Visual breakdown' },
    { id: 'debate', label: 'Debate', icon: <MessageSquare size={18} />, color: 'bg-orange-500/10 text-orange-600', description: 'Opposing views' },
    { id: 'quiz', label: 'Take Quiz', icon: <HelpCircle size={18} />, color: 'bg-yellow-500/10 text-yellow-600', description: 'Test knowledge' },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers size={18} />, color: 'bg-pink-500/10 text-pink-600', description: 'Memory training' },
    { id: 'books', label: 'Find Books', icon: <Library size={18} />, color: 'bg-amber-500/10 text-amber-600', description: 'Related literature' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-secondary/20 border border-border/30 p-8 shadow-sm overflow-hidden mb-12 mt-2 animation-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
           <h3 className="text-xs tracking-[0.2em] uppercase font-mono text-accent-color font-bold m-0 border-none">Deep Exploration Modes</h3>
           <p className="text-xs text-muted-foreground mt-1 font-serif italic m-0">Transform fragment: {topic}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id as ActionType)}
            className="group relative flex flex-col items-start p-5 bg-background border border-border/50 hover:border-accent-color/50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left overflow-hidden shadow-sm"
          >
            <div className={`p-2.5 rounded-xl mb-4 ${mode.color} transition-transform group-hover:scale-110 duration-300 border border-current/10`}>
              {mode.icon}
            </div>
            <h4 className="font-bold text-[16px] font-serif text-foreground m-0 leading-tight mb-1.5">{mode.label}</h4>
            <span className="text-[10px] text-muted-foreground/80 uppercase font-mono tracking-widest">{mode.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionPopup;
