import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  loading: boolean;
  videoTitle: string;
}

const TranscriptModal: React.FC<TranscriptModalProps> = ({ isOpen, onClose, transcript, loading, videoTitle }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 relative z-10 max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-lg leading-tight">{videoTitle}</h3>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 text-sm text-foreground/80 leading-relaxed font-serif pt-2 border-t border-border">
              {loading ? (
                <div className="text-center py-10">Fetching transcript...</div>
              ) : (
                transcript || <p className="italic text-muted-foreground">No transcript available.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TranscriptModal;
