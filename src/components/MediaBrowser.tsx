import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchResult } from '@/services/geminiService';

interface MediaBrowserProps {
  query: string;
  isImageSearchEnabled: boolean;
  isVideoSearchEnabled: boolean;
  isWebSearchEnabled: boolean;
  onResultClick: (title: string, url: string) => void;
}

const MediaBrowser: React.FC<MediaBrowserProps> = ({ 
  query, 
  isImageSearchEnabled, 
  isVideoSearchEnabled, 
  isWebSearchEnabled,
  onResultClick
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [links, setLinks] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [];
        
        // Always try to fetch some of everything for the 'all' view if enabled
        promises.push(axios.get('/api/search', { params: { q: query, type: 'general' } }).catch(() => ({ data: [] })));
        promises.push(axios.get('/api/search', { params: { q: query, type: 'images' } }).catch(() => ({ data: [] })));
        promises.push(axios.get('/api/search', { params: { q: query, type: 'videos' } }).catch(() => ({ data: [] })));

        const [linkRes, imgRes, vidRes] = await Promise.all(promises);

        if (isMounted) {
          setLinks(linkRes.data || []);
          setImages(imgRes.data || []);
          setVideos(vidRes.data || []);
        }
      } catch (e) {
        console.error("Failed to fetch media browser results", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { isMounted = false; };
  }, [query]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
            <div className="h-16 w-16 border-4 border-muted rounded-full"></div>
            <div className="absolute top-0 h-16 w-16 border-4 border-accent-color border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-xl font-serif italic text-muted-foreground animate-pulse">Gathering the web for "{query}"...</p>
      </div>
    );
  }

  const showImages = isImageSearchEnabled && images.length > 0;
  const showVideos = isVideoSearchEnabled && videos.length > 0;
  const showLinks = isWebSearchEnabled && links.length > 0;

  return (
    <div className="media-browser-wrapper max-w-7xl mx-auto px-4 sm:px-6">
      <div className="space-y-16 pb-20 mt-8">
        {/* Videos Section - Featured */}
        {showVideos && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-serif font-bold italic">Featured Videos</h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.slice(0, 6).map((vid, idx) => (
                  <div key={idx} className="group flex flex-col gap-3">
                     <div className="aspect-video relative rounded-3xl overflow-hidden bg-muted/30 border border-border/30 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                        {vid.iframe_src ? (
                          <iframe 
                            src={vid.iframe_src}
                            className="absolute w-full h-full top-0 left-0"
                            frameBorder="0"
                            allowFullScreen
                          />
                        ) : (
                          <a href={vid.url} target="_blank" rel="noopener noreferrer" className="block absolute inset-0">
                             {vid.thumbnail_src && <img src={vid.thumbnail_src} alt={vid.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                             <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white/90 text-accent-color p-4 rounded-full shadow-2xl">
                                  <svg className="w-8 h-8 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
                                </div>
                             </div>
                          </a>
                        )}
                     </div>
                     <div className="px-1">
                        <h3 className="font-serif font-bold text-lg line-clamp-2 leading-tight group-hover:text-accent-color transition-colors">{vid.title}</h3>
                        {vid.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 opacity-70">{vid.content}</p>}
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Images Section - Masonry Grid */}
        {showImages && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-serif font-bold italic">Image Gallery</h2>
             </div>
             <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
                {images.map((img, idx) => (
                  <div key={idx} className="break-inside-avoid animate-in zoom-in-95 duration-500">
                     <a 
                       href={img.url} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="block relative group overflow-hidden rounded-[2rem] border border-border/20 shadow-sm hover:shadow-2xl transition-all"
                     >
                        <img 
                          src={img.img_src || img.thumbnail_src} 
                          alt={img.title} 
                          className="w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                           <p className="text-white text-xs font-serif italic mb-1 drop-shadow-lg">{img.title}</p>
                        </div>
                     </a>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Links Section */}
        {showLinks && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl font-serif font-bold italic">Web Results</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {links.map((link, idx) => (
                  <div key={idx} className="group border-b border-border/20 pb-6 last:border-0 hover:bg-muted/10 p-4 -mx-4 rounded-3xl transition-colors">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-accent-color animate-pulse" />
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-muted-foreground hover:text-accent-color truncate max-w-64 transition-colors">
                          {link.url}
                        </a>
                     </div>
                     <button 
                        onClick={() => onResultClick(link.title, link.url)}
                        className="text-xl font-serif font-bold text-left block group-hover:text-accent-color transition-colors mb-2 leading-tight"
                      >
                        {link.title}
                      </button>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed opacity-80">
                        {link.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                  </div>
                ))}
             </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MediaBrowser;
