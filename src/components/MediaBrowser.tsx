import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { SearchResult } from '@/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Twitter, Instagram, Facebook, Linkedin, Github, Youtube, Globe, Play } from 'lucide-react';
import TranscriptModal from './TranscriptModal';

interface MediaBrowserProps {
  query: string;
  isImageSearchEnabled: boolean;
  isVideoSearchEnabled: boolean;
  isWebSearchEnabled: boolean;
  onResultClick: (title: string, url: string) => void;
}

type TabType = 'all' | 'links' | 'images' | 'videos' | 'social';

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
  const [socials, setSocials] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [loadingTranscript, setLoadingTranscript] = useState<boolean>(false);
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  useEffect(() => {
    if (!query) return;
    let isMounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [];
        
        promises.push(axios.get('/api/search', { params: { q: query, type: 'general' } }).catch(() => ({ data: [] })));
        promises.push(axios.get('/api/search', { params: { q: query, type: 'images' } }).catch(() => ({ data: [] })));
        promises.push(axios.get('/api/search', { params: { q: query, type: 'videos' } }).catch(() => ({ data: [] })));
        promises.push(axios.get('/api/search', { params: { q: query, type: 'social' } }).catch(() => ({ data: [] })));

        const [linkRes, imgRes, vidRes, socRes] = await Promise.all(promises);

        if (isMounted) {
          setLinks(linkRes.data || []);
          setImages(imgRes.data || []);
          setVideos(vidRes.data || []);
          setSocials(socRes.data || []);
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

  const fetchTranscript = async (vidId: string, title: string) => {
    setCurrentVideoTitle(title);
    setIsTranscriptOpen(true);
    setLoadingTranscript(true);
    setTranscript('');
    try {
        const res = await axios.get(`/api/transcript?videoId=${vidId}`);
        setTranscript(res.data.map((t: any) => t.text).join(' '));
    } catch(e) {
        setTranscript("Transcript unavailable");
    } finally {
        setLoadingTranscript(false);
    }
  }

  const getVideoId = (url: string) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        return urlObj.searchParams.get('v');
    } catch {
        // Fallback regex for various formats
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        return match ? match[1] : null;
    }
  }

  const socialLinks = useMemo(() => {
    // Combine filtered links with specific social results
    const socialDomains = ['twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'linkedin.com', 'tiktok.com', 'reddit.com', 'youtube.com', 'github.com'];
    const filteredLinks = links.filter(link => {
      try {
        const domain = new URL(link.url).hostname.replace('www.', '');
        return socialDomains.some(sd => domain.includes(sd));
      } catch {
        return false;
      }
    });

    // Merge and remove duplicates by URL
    const combined = [...socials, ...filteredLinks];
    const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
    return unique;
  }, [links, socials]);

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

  const showImages = (activeTab === 'all' || activeTab === 'images') && images.length > 0;
  const showVideos = (activeTab === 'all' || activeTab === 'videos') && videos.length > 0;
  const showLinks = (activeTab === 'all' || activeTab === 'links') && links.length > 0;
  const showSocials = (activeTab === 'all' || activeTab === 'social') && socialLinks.length > 0;

  const TABS: { id: TabType, label: string }[] = [
    { id: 'all', label: 'ALL' },
    { id: 'links', label: 'LINKS' },
    { id: 'images', label: 'IMAGES' },
    { id: 'videos', label: 'VIDEOS' },
    { id: 'social', label: 'SOCIAL' }
  ];

  return (
    <div className="media-browser-wrapper max-w-7xl mx-auto px-4 sm:px-6">
      {/* Tabs Header */}
      <div className="flex items-center gap-8 border-b border-border/50 mb-12 sticky top-0 bg-[#F4F3ED]/80 backdrop-blur-md z-10 py-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs font-mono tracking-[0.2em] transition-all relative pb-2 ${activeTab === tab.id ? 'text-accent-color font-bold' : 'text-muted-foreground/60 hover:text-muted-foreground'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-color"
              />
            )}
          </button>
        ))}
      </div>

      <TranscriptModal 
        isOpen={isTranscriptOpen} 
        onClose={() => setIsTranscriptOpen(false)} 
        transcript={transcript} 
        loading={loadingTranscript} 
        videoTitle={currentVideoTitle} 
      />

      <div className="space-y-24 pb-20 mt-8">
        {/* Social Links Section - Premium Treatment */}
        {showSocials && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-8">
               <div className="h-1.5 w-1.5 rounded-full bg-[#1DA1F2] animate-pulse" />
               <h2 className="text-sm font-mono uppercase tracking-[0.3em] font-bold text-muted-foreground">Social Links</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {socialLinks.slice(0, activeTab === 'all' ? 10 : 30).map((link, idx) => {
                let domain = 'link';
                let Icon = Globe;
                let bgColor = 'bg-gray-100';
                let iconColor = 'text-gray-600';
                try {
                  domain = new URL(link.url).hostname.replace('www.', '').split('.')[0];
                  if (domain === 'twitter' || domain === 'x') { Icon = Twitter; bgColor = 'bg-blue-50'; iconColor = 'text-[#1DA1F2]'; }
                  if (domain === 'instagram') { Icon = Instagram; bgColor = 'bg-pink-50'; iconColor = 'text-[#E1306C]'; }
                  if (domain === 'facebook') { Icon = Facebook; bgColor = 'bg-blue-50'; iconColor = 'text-[#1877F2]'; }
                  if (domain === 'linkedin') { Icon = Linkedin; bgColor = 'bg-blue-50'; iconColor = 'text-[#0A66C2]'; }
                  if (domain === 'github') { Icon = Github; bgColor = 'bg-gray-100'; iconColor = 'text-[#181717]'; }
                  if (domain === 'youtube') { Icon = Youtube; bgColor = 'bg-red-50'; iconColor = 'text-[#FF0000]'; }
                } catch {}
                return (
                  <a 
                    key={idx} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border/20 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center ${iconColor} transition-transform group-hover:scale-110 flex-shrink-0`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex flex-col min-w-0 pr-2">
                       <span className="text-sm font-semibold text-foreground truncate">{link.title || domain}</span>
                       <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground truncate">{domain}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Videos Section */}
        {showVideos && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-end mb-8 border-l-4 border-accent-color pl-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold italic translate-y-1">Featured Videos</h2>
                  <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mt-1">Curated motion content</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                {videos.slice(0, activeTab === 'all' ? 6 : 24).map((vid, idx) => (
                  <div key={idx} className="group flex flex-col">
                     <div className="aspect-video relative rounded-2xl overflow-hidden bg-muted/30 border border-border/10 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                        {vid.iframe_src ? (
                          <iframe 
                            src={vid.iframe_src}
                            className="absolute w-full h-full top-0 left-0"
                            frameBorder="0"
                            allowFullScreen
                          />
                        ) : (
                          <a href={vid.url} target="_blank" rel="noopener noreferrer" className="block absolute inset-0">
                             {vid.thumbnail_src && <img src={vid.thumbnail_src} alt={vid.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />}
                             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-90 group-hover:scale-100">
                                <div className="bg-white/95 text-accent-color p-5 rounded-full shadow-2xl backdrop-blur-sm">
                                   <svg className="w-10 h-10 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
                                </div>
                             </div>
                          </a>
                        )}
                     </div>
                     <div className="pt-5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-3">
                             <button 
                                onClick={() => fetchTranscript(getVideoId(vid.url) || '', vid.title)}
                                className="px-3 py-1 bg-accent-color/10 rounded-full text-[9px] font-mono text-accent-color uppercase tracking-widest hover:bg-accent-color/20 transition-all font-bold"
                            >
                                Show Transcript
                            </button>
                            <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em]">{vid.engine || 'YOUTUBE'}</span>
                        </div>
                        <h3 className="font-serif font-bold text-xl leading-tight group-hover:text-accent-color transition-all duration-300 line-clamp-2 min-h-[3rem]">{vid.title}</h3>
                        {vid.content && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-3 leading-relaxed italic opacity-80 border-l-2 border-border/40 pl-4 py-1">
                            {vid.content}
                          </p>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* Images Section */}
        {showImages && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
             <div className="flex justify-between items-end mb-10 border-l-4 border-accent-color pl-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold italic translate-y-1">Visual Archive</h2>
                  <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mt-1">High-fidelity imagery</p>
                </div>
             </div>
             <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-8 space-y-8">
                {images.map((img, idx) => (
                  <div key={idx} className="break-inside-avoid animate-in zoom-in-95 duration-700">
                     <a 
                       href={img.url} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="block relative group overflow-hidden rounded-lg border border-border/10 shadow-md hover:shadow-xl transition-all duration-700 bg-muted/20"
                     >
                        <img 
                           src={img.img_src || img.thumbnail_src} 
                           alt={img.title} 
                           className="w-full object-cover transition-transform duration-[1500ms] group-hover:scale-110" 
                           loading="lazy"
                           referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                           <div className="flex justify-between items-center">
                              <p className="text-white/40 text-[7px] font-mono uppercase tracking-[0.1em]">{new URL(img.url).hostname}</p>
                              <span className="text-white/20 text-[7px] font-mono">0x{idx.toString(16).toUpperCase()}</span>
                           </div>
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
             <div className="flex justify-between items-end mb-10 border-l-4 border-accent-color pl-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold italic translate-y-1">Intelligence & Links</h2>
                  <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mt-1">Validated web resources</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                {links.map((link, idx) => (
                  <div key={idx} className="group relative border-b border-border/20 pb-10 last:border-0">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="h-2 w-2 rounded-full bg-accent-color shadow-[0_0_10px_rgba(var(--accent-color),0.5)]" />
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-muted-foreground/50 hover:text-accent-color truncate max-w-[200px] transition-colors tracking-widest uppercase">
                          {new URL(link.url).hostname}
                        </a>
                     </div>
                     <button 
                        onClick={() => onResultClick(link.title, link.url)}
                        className="text-2xl font-serif font-bold text-left block group-hover:text-accent-color transition-colors mb-4 leading-tight group-hover:translate-x-2 transition-transform duration-300"
                      >
                        {link.title}
                      </button>
                      <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed opacity-70 font-serif italic">
                        {link.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* No Results state */}
        {!loading && !showLinks && !showImages && !showVideos && (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
             <div className="w-20 h-20 border border-muted-foreground/20 rounded-full flex items-center justify-center mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
             </div>
             <h3 className="text-2xl font-serif italic">No media fragments found</h3>
             <p className="text-sm font-mono uppercase tracking-widest mt-2">Try adjusting your coordinates</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaBrowser;
