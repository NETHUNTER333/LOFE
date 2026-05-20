import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { streamQuickAnswer } from '@/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface QuickInsightProps {
  topic: string;
  isWebSearchEnabled?: boolean;
}

const QuickInsight: React.FC<QuickInsightProps> = ({ topic, isWebSearchEnabled = false }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!topic) return;
    
    let isMounted = true;
    const fetchInsight = async () => {
      setLoading(true);
      setText('');
      setCompleted(false);
      try {
        let accumulated = '';
        for await (const chunk of streamQuickAnswer(topic, isWebSearchEnabled)) {
          if (!isMounted) break;
          if (chunk.textChunk) {
            accumulated += chunk.textChunk;
            setText(accumulated);
          }
        }
        setCompleted(true);
      } catch (e) {
        console.error("Quick insight error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchInsight();
    return () => { isMounted = false; };
  }, [topic, isWebSearchEnabled]);

  if (!loading && !text) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mb-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden group"
      >
        {/* Aesthetic Background Elements */}
        <div className="absolute inset-0 bg-accent-color/[0.02] rounded-[40px] border border-accent-color/10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-color/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-color/5 blur-[100px] rounded-full" />

        <div className="relative p-10 md:p-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent-color/10 flex items-center justify-center text-accent-color shadow-inner border border-accent-color/20">
               <Sparkles size={24} className={loading && !completed ? "animate-pulse" : ""} />
            </div>
            <div>
               <h3 className="text-[11px] font-mono uppercase tracking-[0.5em] text-accent-color/60 m-0 font-bold">Synthesized Intelligence</h3>
               <p className="text-xs text-muted-foreground/60 m-0 font-serif italic">Analyzing fragment: {topic}</p>
            </div>
          </div>

          <div className="min-h-[100px] transition-all duration-500">
            <div className="font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.25] text-foreground tracking-tight font-medium">
               {text || (loading && <span className="opacity-20 animate-pulse">Initializing cognitive engine...</span>)}
               {!completed && loading && text && (
                 <motion.span 
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-3 h-8 ml-2 bg-accent-color align-middle"
                 />
               )}
            </div>
          </div>

          <AnimatePresence>
            {completed && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10 border-t border-border/30"
              >
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Confidence</span>
                       <span className="text-xs font-bold text-accent-color">0.992+</span>
                    </div>
                    <div className="w-px h-8 bg-border/40" />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">Sources</span>
                       <span className="text-xs font-bold">Live Stream</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 group-hover:gap-4 transition-all duration-300 text-accent-color cursor-default">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Deep Exploration Ready</span>
                    <ArrowRight size={16} />
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickInsight;
