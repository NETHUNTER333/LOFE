import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import { PrivacyPolicy, TermsOfService } from './LegalDocuments';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-full max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border/50"
          >
            {/* Header / Toolbar - PDF Style */}
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-100 dark:bg-zinc-800 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-xs">
                  PDF
                </div>
                <span className="text-sm font-medium text-foreground/80 truncate max-w-[200px] md:max-w-md">
                  {type === 'privacy' ? 'kinich_Privacy_Policy_2026.pdf' : 'kinich_Terms_of_Service_2026.pdf'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-muted-foreground"
                  title="Print Document"
                >
                  <Printer size={18} />
                </button>
                <button 
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-muted-foreground"
                  title="Download Document"
                  onClick={() => alert('Download functionality would save this as a PDF in a real environment.')}
                >
                  <Download size={18} />
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-muted-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Content Area - White Paper Style */}
            <div className="flex-1 overflow-y-auto bg-zinc-200 dark:bg-zinc-950 p-4 md:p-12 flex justify-center">
              <div className="w-full max-w-[800px] bg-white dark:bg-zinc-900 shadow-lg p-8 md:p-16 min-h-full font-serif print:shadow-none print:p-0">
                {type === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
                
                <div className="mt-20 pt-8 border-t border-border text-center text-xs text-muted-foreground font-sans">
                  <p>© 2026 kinich Educational Platform. All rights reserved.</p>
                  <p className="mt-1">This document is generated for informational purposes and constitutes a binding agreement upon use of the service.</p>
                </div>
              </div>
            </div>

            {/* Footer / Status Bar */}
            <div className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>Page 1 of 1</span>
              <span>100% Zoom</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;
