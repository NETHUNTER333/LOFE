/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { PaperDetails, streamTextTransformation } from '../services/geminiService';
import SelectionActionPopup, { TransformAction } from './SelectionActionPopup';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';

interface ContentDisplayProps {
  content: string;
  isLoading: boolean;
  sources: any[];
  paperDetails: PaperDetails | null;
  topic?: string | null;
  title?: string | null;
  isImageSearchEnabled?: boolean;
  isVideoSearchEnabled?: boolean;
}

const MediaGrid: React.FC<{ query: string, isImageSearchEnabled?: boolean, isVideoSearchEnabled?: boolean }> = ({ query, isImageSearchEnabled, isVideoSearchEnabled }) => {
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
     if (!query) return;
     if (isImageSearchEnabled === false && isVideoSearchEnabled === false) {
         setImages([]);
         setVideos([]);
         return;
     }

     let isMounted = true;
     
     const fetchMedia = async () => {
         setLoading(true);
         try {
             const [imgRes, vidRes] = await Promise.all([
                 isImageSearchEnabled !== false ? axios.get('/api/search', { params: { q: query, type: 'images' } }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
                 isVideoSearchEnabled !== false ? axios.get('/api/search', { params: { q: query, type: 'videos' } }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
             ]);
             if (isMounted) {
                 setImages(imgRes.data?.slice(0, 8) || []);
                 setVideos(vidRes.data?.slice(0, 4) || []);
             }
         } catch(e) {
             console.error("Failed to fetch media");
         } finally {
             if (isMounted) setLoading(false);
         }
     };
     fetchMedia();
     return () => { isMounted = false; };
  }, [query, isImageSearchEnabled, isVideoSearchEnabled]);

  if (!images.length && !videos.length && !loading) return null;

  return (
      <div id="media-gallery" className="media-section mt-12 mb-8 bg-muted/10 p-6 rounded-[2rem] border border-border/20">
        <div className="flex items-center gap-3 mb-8">
           <div className="h-1.5 w-1.5 rounded-full bg-accent-color animate-ping" />
           <h3 className="text-sm font-mono uppercase tracking-[0.3em] font-bold text-accent-color">Media Gallery</h3>
        </div>
        
        {loading && images.length === 0 && (
           <div className="flex items-center gap-4 py-10 opacity-50">
              <div className="h-5 w-5 border-2 border-accent-color border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-serif italic">Fetching visuals for "{query}"...</p>
           </div>
        )}

        {videos.length > 0 && (
          <div className="mb-10">
            <h4 className="text-lg font-serif font-bold italic mb-5">Video Resources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {videos.map((vid, idx) => (
                  <div key={idx} className="video-card bg-muted/30 rounded-xl overflow-hidden border border-border/30 hover:border-accent-color transition-colors">
                     {vid.iframe_src ? (
                         <div className="relative pt-[56.25%]">
                             <iframe 
                               className="absolute top-0 left-0 w-full h-full"
                               src={vid.iframe_src} 
                               title={vid.title}
                               frameBorder="0" 
                               allowFullScreen>
                             </iframe>
                         </div>
                     ) : (
                         <a href={vid.url} target="_blank" rel="noopener noreferrer" className="block relative group">
                            <div className="relative pt-[56.25%] bg-black/10">
                                {vid.thumbnail_src && <img src={vid.thumbnail_src} alt={vid.title} className="absolute top-0 left-0 w-full h-full object-cover group-hover:opacity-80 transition-opacity" />}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/50 rounded-full p-3 group-hover:bg-accent-color transition-colors">
                                       <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3">
                               <h4 className="text-sm font-medium line-clamp-2">{vid.title}</h4>
                               {vid.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{vid.content}</p>}
                            </div>
                         </a>
                     )}
                  </div>
               ))}
            </div>
          </div>
        )}
        
        {images.length > 0 && (
          <div>
            <h3 className="text-xl font-medium tracking-tight mb-4 border-b border-border/50 pb-2">Gallery</h3>
            <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
               {images.map((img, idx) => (
                   <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block relative group break-inside-avoid rounded-xl overflow-hidden border border-border/20 shadow-sm hover:shadow-md transition-all">
                       <img src={img.img_src || img.thumbnail_src} alt={img.title} className="w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="absolute bottom-0 left-0 right-0 p-3">
                               <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-md">{img.title}</p>
                           </div>
                       </div>
                   </a>
               ))}
            </div>
          </div>
        )}
      </div>
  );
};

const PaperMetadata: React.FC<{ details: PaperDetails }> = ({ details }) => (
  <section className="paper-metadata">
    <div className="meta-item">
      <span className="meta-label">Authors</span>
      <span className="meta-value">{(Array.isArray(details.authors) ? details.authors : [details.authors]).filter(Boolean).join(', ')}</span>
    </div>
    <div className="meta-item">
      <span className="meta-label">Submitted</span>
      <span className="meta-value">{details.submittedDate}</span>
    </div>
    {details.abstract && details.abstract.trim() && (
      <div className="meta-item abstract">
        <span className="meta-label">Abstract</span>
        <p className="meta-value">{details.abstract}</p>
      </div>
    )}
  </section>
);

const InteractiveContent: React.FC<{
  content: string;
  title?: string | null;
}> = ({ content, title }) => {
  const [selectionState, setSelectionState] = useState<{
    text: string;
    position: { x: number; y: number };
  } | null>(null);
  const [transformResult, setTransformResult] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionState({
        text: selection.toString(),
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom + window.scrollY,
        },
      });
      setTransformResult(null);
    } else if (!isTransforming) {
      setSelectionState(null);
    }
  };

  const handleTransformAction = async (action: TransformAction) => {
    if (!selectionState) return;
    setIsTransforming(true);
    setTransformResult('');
    
    try {
      let accumulatedResult = '';
      for await (const chunk of streamTextTransformation(
        selectionState.text,
        content,
        action,
        title || 'General Topic'
      )) {
        accumulatedResult += chunk;
        setTransformResult(accumulatedResult);
      }
    } catch (error) {
      console.error('Error transforming text:', error);
      setTransformResult('An error occurred while analyzing the text.');
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div onMouseUp={handleMouseUp} className="relative">
      <p className="interactive-text-body">
        {content}
      </p>
      {selectionState && (
        <SelectionActionPopup
          position={selectionState.position}
          onSelectAction={handleTransformAction}
          onClose={() => {
            setSelectionState(null);
            setTransformResult(null);
          }}
          isLoading={isTransforming}
          result={transformResult}
        />
      )}
    </div>
  );
};

const StreamingContent: React.FC<{ content: string }> = ({ content }) => (
  <p className="interactive-text-body">
    {content}
    <span className="blinking-cursor">|</span>
  </p>
);

const References: React.FC<{ sources: any[] }> = ({ sources }) => {
  if (sources.length === 0) {
    return null;
  }
  return (
    <div className="references">
      <h3>References</h3>
      <ol className="references-list">
        {sources.map((source, index) => (
          <li key={index}>
            <a href={source.web.uri} target="_blank" rel="noopener noreferrer">
              {source.web.title || source.web.uri}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
};

const ContentDisplay: React.FC<ContentDisplayProps> = ({ 
  topic, 
  title, 
  content, 
  isLoading, 
  sources, 
  paperDetails,
  isImageSearchEnabled,
  isVideoSearchEnabled 
}) => {
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    const handleScroll = () => {
      const scrollTop = rootElement.scrollTop;
      const scrollHeight = rootElement.scrollHeight;
      const clientHeight = rootElement.clientHeight;
      const scrollableHeight = scrollHeight - clientHeight;
      
      if (scrollableHeight <= 0) {
        setReadProgress(100);
        return;
      }
      
      const progress = (scrollTop / scrollableHeight) * 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };

    rootElement.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      rootElement.removeEventListener('scroll', handleScroll);
    };
  }, [content, isLoading]);

  return (
    <div className="article-container">
      <AnimatePresence>
        {readProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[60] font-mono text-[11px] font-bold tracking-widest text-[#292929]/40 pointer-events-none mix-blend-multiply"
          >
            {Math.round(readProgress)}%
          </motion.div>
        )}
      </AnimatePresence>
      <div className="reading-progress-bar" style={{ width: `${readProgress}%` }} />
      
      {title && <h2 className="article-main-title">{title}</h2>}
      
      {paperDetails && <PaperMetadata details={paperDetails} />}
      
      <article className="article-body">
        {isLoading && content ? 
          <StreamingContent content={content} /> : 
          <InteractiveContent content={content} title={title} />
        }
      </article>
      
      {topic && <MediaGrid query={topic} isImageSearchEnabled={isImageSearchEnabled} isVideoSearchEnabled={isVideoSearchEnabled} />}
      {!isLoading && <References sources={sources} />}
    </div>
  );
};

export default ContentDisplay;