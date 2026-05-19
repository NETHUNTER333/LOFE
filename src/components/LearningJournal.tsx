/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { getLearningSyllabus, streamLearningPageContent, streamJournalChatResponse, SyllabusItem, NotebookPage, ChatMessage } from '../services/geminiService';
import LoadingSkeleton from './LoadingSkeleton';
import { PromptInputBox } from './ui/ai-prompt-box';
import { AnimatedTextGenerate } from './ui/animated-textgenerate';

interface LearningJournalProps {
  topic: string;
  onClose: () => void;
}

const LearningJournal: React.FC<LearningJournalProps> = ({ topic, onClose }) => {
  const [syllabus, setSyllabus] = useState<SyllabusItem[] | null>(null);
  const [notebookPages, setNotebookPages] = useState<NotebookPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number | null>(null);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState<boolean>(true);
  const [isLoadingPage, setIsLoadingPage] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const loadedPagesRef = useRef(new Set<number>());

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setIsSidebarVisible(true);
      }
    };
    window.addEventListener('resize', checkMobile);
    checkMobile();
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSyllabusItemClick = async (index: number) => {
    if (!syllabus) return;

    if (isMobileView) {
      setIsSidebarVisible(false);
    }

    setCurrentPageIndex(index);
    setChatMessages([]);
    contentRef.current?.scrollTo(0, 0);

    if (loadedPagesRef.current.has(index) || isLoadingPage === index) {
      return;
    }

    setIsLoadingPage(index);
    try {
      let accumulatedContent = '';
      const chapterTitle = syllabus[index].title;
      for await (const chunk of streamLearningPageContent(topic, chapterTitle)) {
        accumulatedContent += chunk;
        setNotebookPages(prev => {
          const newPages = [...prev];
          if (newPages[index]) {
            newPages[index].content = accumulatedContent;
          }
          return newPages;
        });
      }
      loadedPagesRef.current.add(index);
    } catch (err) {
      console.error("Failed to load page content:", err);
      const errorMessage = err instanceof Error ? err.message : 'Error loading content.';
      setNotebookPages(prev => {
          const newPages = [...prev];
          if (newPages[index]) {
              newPages[index].content = errorMessage;
          }
          return newPages;
      });
    } finally {
      setIsLoadingPage(null);
    }
  };

  useEffect(() => {
    setIsLoadingSyllabus(true);
    setError(null);
    setSyllabus(null);
    setNotebookPages([]);
    setCurrentPageIndex(null);
    loadedPagesRef.current.clear();
    setIsSidebarVisible(true);

    const fetchSyllabus = async () => {
      try {
        const newSyllabus = await getLearningSyllabus(topic);
        setSyllabus(newSyllabus);
        setNotebookPages(newSyllabus.map(item => ({ title: item.title, content: '' })));
      } catch (err) {
        console.error("Failed to fetch syllabus:", err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate the learning syllabus.';
        setError(errorMessage);
      } finally {
        setIsLoadingSyllabus(false);
      }
    };
    
    fetchSyllabus();
  }, [topic]);

  useEffect(() => {
      if (syllabus && syllabus.length > 0 && currentPageIndex === null) {
          handleSyllabusItemClick(0);
      }
  }, [syllabus, currentPageIndex, handleSyllabusItemClick]);

  const handlePromptSend = async (message: string, files?: File[]) => {
      if (currentPageIndex === null || !message.trim() || isChatLoading) return;

      setIsChatLoading(true);

      const currentNotes = notebookPages[currentPageIndex]?.content || '';
      const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: message }];
      setChatMessages(newMessages);

      let accumulatedResponse = '';
      const modelMessageIndex = newMessages.length;
      
      try {
        for await (const chunk of streamJournalChatResponse(topic, currentNotes, chatMessages, message)) {
            accumulatedResponse += chunk;
            setChatMessages(prev => {
                const updated = [...prev];
                if (updated[modelMessageIndex]) {
                    updated[modelMessageIndex].content = accumulatedResponse;
                } else {
                    updated.push({ role: 'model', content: accumulatedResponse });
                }
                return updated;
            });
        }
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred during chat.';
          setChatMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const currentPage = currentPageIndex !== null ? notebookPages[currentPageIndex] : null;
  const journalClass = `learning-journal ${isMobileView && !isSidebarVisible ? 'content-visible' : ''}`;

  return (
    <div className="learning-journal-overlay">
      <div className={journalClass}>
        <header className="journal-header">
          <h1>{topic}</h1>
          <button onClick={onClose} className="journal-close-btn" aria-label="Exit learning session">&times;</button>
        </header>
        <div className="journal-body">
          <aside className="journal-sidebar">
            <h2>Table of Contents</h2>
            {isLoadingSyllabus ? (
              <div style={{padding: '0 1rem'}}><LoadingSkeleton /></div>
            ) : error ? (
              <div style={{ padding: '0 1rem', color: '#8B0000' }}>
                <p><strong>Error</strong></p>
                <p>{error}</p>
              </div>
            ) : (
              <nav>
                <ul className="syllabus-list">
                  {syllabus?.map((item, index) => (
                    <li key={index}>
                      <button 
                        onClick={() => handleSyllabusItemClick(index)}
                        className={`syllabus-item ${currentPageIndex === index ? 'active' : ''}`}
                      >
                        <span className="syllabus-index">0{index + 1}</span>
                        <div className="syllabus-details">
                          <span className="syllabus-title">{item.title}</span>
                          <span className="syllabus-description">{item.description}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </aside>
            <main className="journal-content-area" ref={contentRef} style={{ paddingBottom: '120px' }}>
            {currentPageIndex !== null && currentPage ? (
              <div className="journal-page-content">
                {isMobileView && (
                  <button onClick={() => setIsSidebarVisible(true)} className="back-to-syllabus-btn">
                    &larr; Back to Contents
                  </button>
                )}
                <h3 className="chapter-title">{currentPage.title}</h3>
                
                <div className="animated-content-wrapper">
                  <AnimatedTextGenerate 
                    text={currentPage.content || "Generating content..."}
                    className="text-left mb-8"
                    textClassName="text-lg md:text-xl leading-relaxed text-foreground"
                    blurEffect={true}
                    speed={2}
                    highlightWords={[topic, currentPage.title, "important", "key", "concept"]}
                    highlightClassName="text-red-500 dark:text-red-400 font-bold"
                    linkWords={syllabus ? syllabus.map(s => s.title) : []}
                    linkHrefs={syllabus ? syllabus.map(() => "#") : []}
                    linkClassNames={[
                      "underline decoration-pink-500 dark:decoration-pink-400 hover:decoration-pink-400 dark:hover:decoration-pink-300 transition",
                      "underline decoration-sky-500 dark:decoration-sky-400 hover:decoration-sky-400 dark:hover:decoration-sky-300 transition",
                      "underline decoration-blue-500 dark:decoration-blue-400 hover:decoration-blue-400 dark:hover:decoration-blue-300 transition",
                    ]}
                    isStreaming={isLoadingPage === currentPageIndex}
                  />
                </div>

                <div className="journal-chat-area">
                  {chatMessages.length > 0 && (
                     <div className="journal-chat-messages">
                        {chatMessages.map((msg, index) => (
                          <div key={index} className={`chat-message ${msg.role}`}>
                            <div className="message-bubble">
                              {msg.role === 'model' ? (
                                <AnimatedTextGenerate 
                                  text={msg.content}
                                  className="text-left"
                                  textClassName="text-sm md:text-base"
                                  blurEffect={true}
                                  speed={3}
                                  isStreaming={isChatLoading && index === chatMessages.length - 1}
                                />
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && chatMessages[chatMessages.length - 1]?.role === 'user' && (
                          <div className="chat-message model">
                            <div className="message-bubble">
                              <span className="blinking-cursor">|</span>
                            </div>
                          </div>
                        )}
                        <div ref={chatMessagesEndRef} />
                      </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
                    AI can provide inaccurate info. Verify important facts.
                  </p>
                </div>
              </div>
            ) : (
              !isLoadingSyllabus && !error && <div className="journal-placeholder">Select a chapter to begin.</div>
            )}
          </main>
          
          {currentPageIndex !== null && (
            <div className="journal-fixed-input-container">
              <PromptInputBox 
                onSend={handlePromptSend}
                isLoading={isChatLoading}
                placeholder="Ask a question about this chapter..."
                className="journal-prompt-box"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningJournal;