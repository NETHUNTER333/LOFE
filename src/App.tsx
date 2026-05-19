/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getTrendingTopics,
  getArticlesForCategory, 
  streamEnhancedContent,
  getQuiz,
  streamChatResponse,
  getArticleMindMap,
  findRelatedBooks,
  expandMindMapSection,
  streamDebate,
  getFlashcards,
  streamDefinition,
  findPdfLink,
  TrendingTopics, 
  Paper, 
  PaperDetails,
  Quiz,
  ChatMessage,
  MindMapData,
  MindMapNode,
  Book,
  DebateTurn,
  Flashcard,
  Task,
  TaskPriority,
  TaskStatus,
  SearchResult,
} from '@/services/geminiService';
import ContentDisplay from '@/components/ContentDisplay';
import SearchBar from '@/components/SearchBar';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ActionPopup from '@/components/ActionPopup';
import QuizDisplay from '@/components/QuizDisplay';
import ChatInterface from '@/components/ChatInterface';
import MindMapDisplay from '@/components/MindMapDisplay';
import BookFinderDisplay from '@/components/BookFinderDisplay';
import AgentsPopup, { AgentProfile } from '@/components/AgentsPopup';
import DebateSetup from '@/components/DebateSetup';
import DebateDisplay from '@/components/DebateDisplay';
import DownloadPopup from '@/components/DownloadPopup';
import FlashcardDisplay from '@/components/FlashcardDisplay';
import LearningJournal from '@/components/LearningJournal';
import ThinkingDropdown from '@/components/ThinkingDropdown';
import LegalModal from '@/components/LegalModal';
import TaskBoard from '@/components/TaskBoard';
import Settings, { Theme } from '@/components/Settings';
import MediaBrowser from '@/components/MediaBrowser';

const PREDEFINED_WORDS = [
  'Quantum Entanglement', 'General Relativity', 'CRISPR', 'Machine Learning', 'Black Hole', 
  'DNA', 'Photosynthesis', 'String Theory', 'Dark Matter', 'Higgs Boson', 'Neuroplasticity',
  'Game Theory', 'Cryptography', 'Turing Machine', 'Gödel\'s Incompleteness Theorems',
  'Mitochondria', 'Superconductivity', 'Entropy', 'Plate Tectonics', 'Evolution'
];
const UNIQUE_WORDS = [...new Set(PREDEFINED_WORDS)];

interface ClassicWork {
  title: string;
  author: string;
  year: string;
  abstract: string;
  content: string;
}

interface Bookmark {
  id: string;
  type: 'topic' | 'paper';
  title: string;
  topic: string;
  arxivId?: string;
  timestamp: number;
}

interface RecentItem {
  id: string;
  type: 'topic' | 'paper';
  title: string;
  arxivId?: string;
  timestamp: number;
}

const CLASSIC_WORKS: ClassicWork[] = [
  {
    title: "Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid",
    author: "J. D. Watson & F. H. C. Crick",
    year: "April 25, 1953",
    abstract: "This seminal one-page paper, published in Nature, proposed the famous double helix structure for DNA, revolutionizing the understanding of genetics and molecular biology.",
    content: "We wish to suggest a a structure for the salt of deoxyribose nucleic acid (D.N.A.). This structure has novel features which are of considerable biological interest.\n\nA structure for nucleic acid has already been proposed by Pauling and Corey. They kindly made their manuscript available to us in advance of publication. Their model consists of three intertwined chains, with the phosphates near the fibre axis, and the bases on the outside. In our opinion, this structure is unsatisfactory for two reasons: (1) We believe that the material which gives the X-ray diagrams is the salt, not the free acid. Without the acidic hydrogen atoms it is not clear what forces would hold the structure together, especially as the negatively charged phosphates near the axis will repel each other. (2) Some of the van der Waals distances appear to be too small.\n\nWe wish to put forward a radically different structure for the salt of deoxyribose nucleic acid. This structure has two helical chains each coiled round the same axis. We have made the usual chemical assumptions, namely, that each chain consists of phosphate diester groups joining beta-D-deoxyribofuranose residues with 3',5' linkages. The two chains (but not their bases) are related by a dyad perpendicular to the fibre axis. Both chains follow right-handed helices, but owing to the dyad the sequences of the atoms in the two chains run in opposite directions. Each chain loosely resembles Furberg's model No. 1 ; that is, the bases are on the inside of the helix and the phosphates on the outside. The configuration of the sugar and the atoms near it is close to Furberg's 'standard configuration', the sugar being roughly perpendicular to the attached base. There is a residue on each chain every 3.4 A. in the z-direction. We have assumed an angle of 36 degrees between adjacent residues in the same chain, so that the structure repeats after 10 residues on each chain, that is, after 34 A. The distance of a phosphorus atom from the fibre axis is 10 A. As the phosphates are on the outside, cations have easy access to them.\n\nThe structure is an open one, and its water content is rather high. At lower water contents we would expect the bases to tilt so that the structure could become more compact.\n\nThe novel feature of the structure is the manner in which the two chains are held together by the purine and pyrimidine bases. The planes of the bases are perpendicular to the fibre axis. They are joined together in pairs, a single base from one chain being hydrogen-bonded to a single base from the other chain, so that the two lie side by side with identical z-co-ordinates. One of the pair must be a purine and the other a pyrimidine for bonding to occur. The hydrogen bonds are made as follows : purine position 1 to pyrimidine position 1 ; purine position 6 to pyrimidine position 6.\n\nIf it is assumed that the bases only occur in the structure in the most plausible tautomeric forms (that is, with the keto rather than the enol configurations) it is found that only specific pairs of bases can bond together. These pairs are : adenine (purine) with thymine (pyrimidine), and guanine (purine) with cytosine (pyrimidine).\n\nIn other words, if an adenine forms one member of a pair, on either chain, then on these assumptions the other member must be thymine ; similarly for guanine and cytosine. The sequence of bases on a single chain does not appear to be restricted in any way. However, if only specific pairs of bases can be formed, it follows that if the sequence of bases on one chain is given, then the sequence on the other chain is automatically determined.\n\nIt has been found experimentally that the ratio of the amounts of adenine to thymine, and the ratio of guanine to cytosine, are always very close to unity for deoxyribose nucleic acid.\n\nIt is probably impossible to build this structure with a ribose sugar in place of the deoxyribose, as the extra oxygen atom would make too close a van der Waals contact.\n\nThe previously published X-ray data on deoxyribose nucleic acid are insufficient for a rigorous test of our structure. So far as we can tell, it is roughly compatible with the experimental data, but it must be regarded as unproved until it has been checked against more exact results.\n\nWe were not aware of the details of the results presented elsewhere when we devised our structure, which rests mainly though not entirely on published experimental data and stereochemical arguments.\n\nIt has not escaped our notice that the specific pairing we have postulated immediately suggests a possible copying mechanism for the genetic material."
  },
  {
    title: "On Computable Numbers, with an Application to the Entscheidungsproblem",
    author: "Alan M. Turing",
    year: "November 12, 1936",
    abstract: "A landmark paper in computer science and mathematics that introduced the concept of the Turing machine, a formal model of computation that defines the limits of what can be computed.",
    content: "The 'computable' numbers may be described briefly as the real numbers whose expressions as a decimal are calculable by finite means. Although the subject of this paper is ostensibly the computable numbers, it is almost equally easy to define and investigate computable functions of an integral variable or a real or computable variable, computable predicates, and so forth. The fundamental problems involved are, however, the same in each case, and I have chosen the computable numbers for explicit treatment as involving the least cumbrous technique. I hope shortly to give an account of the relations of the computable numbers, functions, and so forth to one another. This will include a development of the theory of functions of a real variable expressed in terms of computable numbers. According to my definition, a number is computable if its decimal can be written down by a machine.\n\nIn §§ 9, 10 I give some arguments with the intention of showing that the computable numbers include all numbers which could naturally be regarded as computable. In particular, I show that certain large classes of numbers are computable. They include, for instance, the real parts of all algebraic numbers, the real parts of the zeros of the Bessel functions, the numbers π, e, etc. The computable numbers do not, however, include all definable numbers, and an example is given of a definable number which is not computable.\n\nAlthough the class of computable numbers is so great, and in many ways similar to the class of real numbers, it is nevertheless enumerable. In § 8 I examine certain arguments which would seem to prove the contrary. By the correct application of one of these arguments, conclusions are reached which are superficially similar to those of Gödel. These results have valuable applications. In particular, it is shown (§ 11) that the Hilbertian 'Entscheidungsproblem' can have no solution."
  }
];

const AGENTS: AgentProfile[] = [
  {
    id: 'neutral',
    name: 'The Encyclopedist',
    title: 'Standard kinich Agent',
    description: 'Provides comprehensive, neutral, and well-structured information, acting as a standard encyclopedia.',
    systemInstruction: 'You are an encyclopedia. Provide detailed, neutral, and well-structured information.',
  },
  {
    id: 'historian',
    name: 'The Historian',
    title: 'Chronicler of the Past',
    description: 'Focuses on the historical context, origins, key figures, and the timeline of developments for any given topic.',
    systemInstruction: 'You are a historian. When explaining topics, focus on the historical context, origins, key figures, and the timeline of developments.',
  },
  {
    id: 'simplifier',
    name: 'The Simplifier',
    title: 'Master of Analogy',
    description: 'Breaks down complex topics into simple, easy-to-understand explanations using analogies and first principles.',
    systemInstruction: 'You are an expert simplifier. Break down complex topics into simple, easy-to-understand explanations using analogies and first principles. Avoid jargon where possible.',
  },
  {
    id: 'futurist',
    name: 'The Futurist',
    title: 'Visionary of Tomorrow',
    description: 'Explores the modern applications, future implications, and speculative possibilities of a topic.',
    systemInstruction: 'You are a futurist. When explaining topics, focus on modern applications, future implications, and speculative possibilities.',
  },
  {
    id: 'skeptic',
    name: 'The Skeptic',
    title: 'The Devil\'s Advocate',
    description: 'Critically examines topics by posing tough questions, exploring counter-arguments, and highlighting potential limitations or controversies.',
    systemInstruction: 'You are a skeptical critic. When explaining topics, critically examine them by posing tough questions, exploring counter-arguments, and highlighting potential limitations or controversies.',
  }
];


const SURPRISE_ME_POOL: (string | ClassicWork)[] = [...UNIQUE_WORDS, ...CLASSIC_WORKS];

type ActionType = 'full' | 'summary' | 'cot' | 'quiz' | 'flashcards' | 'books' | 'debate' | 'mindmap' | 'pdf';

const App: React.FC = () => {
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [currentArxivId, setCurrentArxivId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [thoughts, setThoughts] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingDuration, setThinkingDuration] = useState<number>(0);
  const [contentTitle, setContentTitle] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [flashcardsData, setFlashcardsData] = useState<Flashcard[] | null>(null);
  const [bookListData, setBookListData] = useState<Book[] | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [paperDetails, setPaperDetails] = useState<PaperDetails | null>(null);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isRefreshingTopics, setIsRefreshingTopics] = useState<boolean>(true);
  const [isExpandingMindMap, setIsExpandingMindMap] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState<boolean>(true);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>(() => {
    try {
      const saved = localStorage.getItem('recentlyViewed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('localStorage access failed', e);
      return [];
    }
  });
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopics | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'paper';
    } catch (e) {
      console.warn('localStorage access failed', e);
      return 'paper';
    }
  });
  const [isFetchingPaper, setIsFetchingPaper] = useState<boolean>(false);
  const [showActionPopup, setShowActionPopup] = useState<boolean>(false);
  const [browserQuery, setBrowserQuery] = useState<string | null>(null);
  
  // State for Agents
  const [isAgentsPopupOpen, setIsAgentsPopupOpen] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  // State for follow-up chat
  const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('isMemoryEnabled') === 'true';
    } catch (e) {
      console.warn('localStorage access failed', e);
      return false;
    }
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isFollowUpActive, setIsFollowUpActive] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  
  // State for Debate
  const [isDebateSetupActive, setIsDebateSetupActive] = useState<boolean>(false);
  const [debatingAgents, setDebatingAgents] = useState<[AgentProfile, AgentProfile] | null>(null);
  const [debateTurns, setDebateTurns] = useState<DebateTurn[]>([]);
  const [debateFollowUp, setDebateFollowUp] = useState<{ turnIndex: number; agent: AgentProfile; messages: ChatMessage[] } | null>(null);
  
  // State for Download
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState<boolean>(false);

  // State for Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // State for Legal
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
    isOpen: false,
    type: 'privacy'
  });

  // State for Interactive Learning
  const [isLearningMode, setIsLearningMode] = useState<boolean>(false);
  const [isLearningActive, setIsLearningActive] = useState<boolean>(false);

  // State for Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('localStorage access failed', e);
      return [];
    }
  });

  // State for Liked Papers
  const [likedPapers, setLikedPapers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kinich_likes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('localStorage access failed', e);
      return [];
    }
  });

  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // State for Tasks
  const [isTasksPageOpen, setIsTasksPageOpen] = useState<boolean>(false);
  const [isChatPageOpen, setIsChatPageOpen] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('localStorage access failed', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('localStorage access failed', e);
    }
  }, [tasks]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      status: taskData.status || TaskStatus.PENDING
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const getTasks = useCallback(() => tasks, [tasks]);

  const taskCallbacks = { addTask, updateTask, deleteTask, getTasks };

  useEffect(() => {
    try {
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('localStorage access failed', e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('kinich_likes', JSON.stringify(likedPapers));
    } catch (e) {
      console.warn('localStorage access failed', e);
    }
  }, [likedPapers]);

  useEffect(() => {
    try {
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    } catch (e) {
      console.warn('localStorage access failed', e);
    }
  }, [recentlyViewed]);

  const toggleLike = (id: string) => {
    if (!id) return;
    setLikedPapers(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      return [...prev, id];
    });
  };

  const handleLoadMoreCategory = async (category: string) => {
    if (!trendingTopics) return;
    setLoadingCategory(category);
    const currentPapers = trendingTopics[category] || [];
    try {
      const newPapers = await getArticlesForCategory(category, currentPapers.length);
      setTrendingTopics(prev => prev ? {
        ...prev,
        [category]: [...currentPapers, ...newPapers]
      } : null);
    } catch (err) {
      console.error(err);
    }
    setLoadingCategory(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const cat = newCategoryName.trim();
    setNewCategoryName('');
    
    setTrendingTopics(prev => {
      if (prev && prev[cat]) return prev;
      return prev ? { ...prev, [cat]: [] } : { [cat]: [] };
    });
    
    setLoadingCategory(cat);
    try {
      const newPapers = await getArticlesForCategory(cat, 0);
      setTrendingTopics(prev => prev ? { ...prev, [cat]: newPapers } : null);
    } catch (err) {
      console.error(err);
    }
    setLoadingCategory(null);
  };

  const toggleBookmark = (topic: string, arxivId?: string) => {
    const bookmarkId = arxivId || topic;
    const isBookmarked = bookmarks.some(b => b.id === bookmarkId);

    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } else {
      const newBookmark: Bookmark = {
        id: bookmarkId,
        type: arxivId ? 'paper' : 'topic',
        title: topic,
        topic: topic,
        arxivId: arxivId,
        timestamp: Date.now()
      };
      setBookmarks(prev => [newBookmark, ...prev]);
    }
  };

  const isCurrentTopicBookmarked = bookmarks.some(b => b.id === (currentArxivId || currentTopic));


  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('localStorage access failed', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('isMemoryEnabled', String(isMemoryEnabled));
    } catch (e) {
      console.warn('localStorage access failed', e);
    }
  }, [isMemoryEnabled]);
  
  const resetContentState = useCallback(() => {
    setContent('');
    setThoughts('');
    setIsThinking(false);
    setThinkingDuration(0);
    setLoadingProgress(0);
    setSources([]);
    setPaperDetails(null);
    setQuizData(null);
    setFlashcardsData(null);
    setBookListData(null);
    setContentTitle(null);
    setError(null);
    setGenerationTime(null);
    setShowActionPopup(false);
    setMindMapData(null);
    setCurrentUrl(null);
    setMessages([]);
    setIsFollowUpActive(false);
    setIsDebateSetupActive(false);
    setDebateTurns([]);
    setDebatingAgents(null);
    setDebateFollowUp(null);
    setIsDownloadPopupOpen(false);
  }, []);

  const handleTopicSelection = useCallback((topic: string, isPaper: boolean, arxivId?: string, url?: string) => {
    resetContentState();
    setIsFetchingPaper(isPaper);
    setCurrentTopic(topic);
    setCurrentArxivId(arxivId || null);
    setCurrentUrl(url || null);

    // Update Recently Viewed
    setRecentlyViewed(prev => {
      const newItem: RecentItem = {
        id: arxivId || topic,
        type: isPaper ? 'paper' : 'topic',
        title: topic,
        arxivId: arxivId,
        timestamp: Date.now()
      };
      const filtered = prev.filter(item => item.id !== newItem.id);
      return [newItem, ...filtered].slice(0, 10);
    });
    
    if (isLearningMode) {
      setIsLearningActive(true);
    } else {
      setShowActionPopup(true);
    }
  }, [resetContentState, isLearningMode]);

  const handleDiscover = useCallback(async () => {
    setIsRefreshingTopics(true);
    resetContentState();
    setCurrentTopic(null);
    setIsLearningMode(false); // Disable learn mode when discovering
    try {
      const topics = await getTrendingTopics();
      setTrendingTopics(topics);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not fetch topics.');
      setTrendingTopics(null);
    } finally {
      setIsRefreshingTopics(false);
    }
  }, [resetContentState]);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
    handleDiscover();
  }, [handleDiscover]);
  
  const handleSearch = useCallback((topic: string) => {
    if (!topic.trim()) return;
    setBrowserQuery(topic.trim());
    setCurrentTopic(null); // Clear current article to show browser
    resetContentState();
  }, [resetContentState]);

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    let arxivId: string | undefined = undefined;
    if (result.url.includes('arxiv.org')) {
      const match = result.url.match(/(\d{4}\.\d{4,5})/);
      if (match) arxivId = match[1];
    }
    handleTopicSelection(result.title, !!arxivId, arxivId, result.url);
  }, [handleTopicSelection]);

  const handleSurpriseMe = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * SURPRISE_ME_POOL.length);
    let selection = SURPRISE_ME_POOL[randomIndex];

    // Simple check to avoid repeating the exact same title if it's currently displayed
    const selectionTitle = typeof selection === 'string' ? selection : selection.title;
    if (currentTopic && selectionTitle.toLowerCase() === currentTopic.toLowerCase()) {
        const nextIndex = (randomIndex + 1) % SURPRISE_ME_POOL.length;
        selection = SURPRISE_ME_POOL[nextIndex];
    }
    
    resetContentState();
    setTrendingTopics(null);
    
    if (typeof selection === 'string') {
      handleTopicSelection(selection, false);
    } else { // It's a ClassicWork
      setCurrentTopic(selection.title);
      setContent(selection.content);
      setContentTitle('Full Article');
      setPaperDetails({
        authors: [selection.author],
        submittedDate: selection.year,
        abstract: selection.abstract,
      });
    }
  }, [currentTopic, resetContentState, handleTopicSelection]);

  const handleGoBackToDiscover = useCallback(() => {
    resetContentState();
    setCurrentTopic(null);
    setBrowserQuery(null);
    setIsLearningMode(false);
    setIsLearningActive(false);
  }, [resetContentState]);
  
  const handleCloseLearning = () => {
    setIsLearningActive(false);
  };

  const handleActionSelect = async (action: ActionType) => {
    if (!currentTopic) return;
    
    setShowActionPopup(false);
    resetContentState(); // Reset again to clear for new content
    
    if (action === 'debate') {
      setIsDebateSetupActive(true);
      return;
    }

    if (action === 'pdf') {
      setIsLoading(true);
      const startTime = performance.now();
      try {
        let pdfUrl: string | null = null;
        if (currentArxivId) {
          pdfUrl = `https://arxiv.org/pdf/${currentArxivId}.pdf`;
        } else {
          pdfUrl = await findPdfLink(currentTopic);
        }

        if (pdfUrl) {
          window.open(pdfUrl, '_blank');
          setShowActionPopup(false); // Close popup but don't reset content state
          setIsLoading(false);
          return;
        } else {
          setError('Could not find a direct PDF link for this topic.');
        }
      } catch (e) {
        setError('An error occurred while trying to find the PDF.');
      } finally {
        const endTime = performance.now();
        setGenerationTime(endTime - startTime);
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);
    setLoadingProgress(10);
    const startTime = performance.now();
    const agentInstruction = selectedAgent?.systemInstruction || 'You are an encyclopedia. Provide detailed, neutral, and well-structured information.';
    
    try {
      if (action === 'quiz') {
        setLoadingProgress(30);
        const quiz = await getQuiz(currentTopic, agentInstruction);
        setLoadingProgress(100);
        setQuizData(quiz);
      } else if (action === 'flashcards') {
        setLoadingProgress(30);
        const flashcards = await getFlashcards(currentTopic, agentInstruction);
        setLoadingProgress(100);
        setFlashcardsData(flashcards);
      } else if (action === 'books') {
        setLoadingProgress(30);
        const books = await findRelatedBooks(currentTopic);
        setLoadingProgress(100);
        setBookListData(books);
      } else if (action === 'mindmap') {
        setLoadingProgress(30);
        const mindMap = await getArticleMindMap(currentTopic, isFetchingPaper, agentInstruction);
        setLoadingProgress(100);
        setMindMapData(mindMap);
      } else { // 'full', 'summary', or 'cot'
        if (action === 'full') {
            setContentTitle('Full Article');
            let accumulatedContent = '';
            setLoadingProgress(15);
            let chunkCount = 0;
            for await (const chunk of streamDefinition(currentTopic, isWebSearchEnabled, isFetchingPaper, currentUrl || undefined)) {
               chunkCount++;
               if (chunk.textChunk) {
                accumulatedContent += chunk.textChunk;
                setContent(accumulatedContent);
                // Simulate progress: move from 15 to 95 based on chunks
                setLoadingProgress(prev => Math.min(95, prev + (1 / (chunkCount * 0.5 + 1)) * 5));
              }
              if (chunk.metadata) {
                setLoadingProgress(prev => Math.max(prev, 30));
                setPaperDetails(chunk.metadata);
              }
              if (chunk.sources) {
                setSources(chunk.sources);
              }
            }
            setLoadingProgress(100);
        } else {
            setContentTitle(action === 'summary' ? 'Summary' : 'Chain-of-Thought Explanation');
            let accumulatedContent = '';
            let accumulatedThoughts = '';
            
            if (action === 'cot') {
              setIsThinking(true);
            }
            
            setLoadingProgress(15);
            let chunkCount = 0;
            const thoughtStartTime = performance.now();

            for await (const chunk of streamEnhancedContent(currentTopic, action, agentInstruction)) {
               chunkCount++;
               if (chunk.thoughtChunk) {
                 accumulatedThoughts += chunk.thoughtChunk;
                 setThoughts(accumulatedThoughts);
                 setThinkingDuration((performance.now() - thoughtStartTime) / 1000);
                 setLoadingProgress(prev => Math.min(40, prev + 1));
               }
               if (chunk.textChunk) {
                 if (isThinking) {
                   setIsThinking(false);
                   // Final duration update
                   setThinkingDuration((performance.now() - thoughtStartTime) / 1000);
                 }
                 accumulatedContent += chunk.textChunk;
                 setContent(accumulatedContent);
                 setLoadingProgress(prev => Math.min(95, Math.max(40, prev + (1 / (chunkCount * 0.1 + 1)))));
              }
            }
            setLoadingProgress(100);
            setIsThinking(false);
        }
        setIsFollowUpActive(true);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error(e);
    } finally {
      const endTime = performance.now();
      setGenerationTime(endTime - startTime);
      setIsLoading(false);
    }
  };

  const handleStartDebate = async (agent1: AgentProfile, agent2: AgentProfile) => {
    if (!currentTopic) return;
    setIsDebateSetupActive(false);
    setIsLoading(true);
    setDebatingAgents([agent1, agent2]);
    setDebateFollowUp(null);
    const startTime = performance.now();

    try {
      let accumulatedText = '';
      const speakerMarker = '###SPEAKER:';

      for await (const chunk of streamDebate(currentTopic, agent1, agent2)) {
        if (chunk.textChunk) {
          accumulatedText += chunk.textChunk;

          let lastProcessedIndex = 0;
          let nextMarkerIndex = accumulatedText.indexOf(speakerMarker, lastProcessedIndex);
          
          const turns: DebateTurn[] = [];
          while (nextMarkerIndex !== -1) {
              const nextSpeakerStartIndex = nextMarkerIndex + speakerMarker.length;
              const endOfLineIndex = accumulatedText.indexOf('\n', nextSpeakerStartIndex);
              if (endOfLineIndex === -1) break; 

              const agentName = accumulatedText.substring(nextSpeakerStartIndex, endOfLineIndex).trim();
              
              const nextTurnMarkerIndex = accumulatedText.indexOf(speakerMarker, endOfLineIndex);
              const endOfStatement = nextTurnMarkerIndex === -1 ? accumulatedText.length : nextTurnMarkerIndex;
              const statement = accumulatedText.substring(endOfLineIndex + 1, endOfStatement).trim();

              if (agentName && statement) {
                turns.push({ agentName, statement });
              }
              
              lastProcessedIndex = endOfStatement;
              nextMarkerIndex = accumulatedText.indexOf(speakerMarker, lastProcessedIndex);
          }
          setDebateTurns(turns);
        }
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during debate.';
      setError(errorMessage);
      console.error(e);
    } finally {
      const endTime = performance.now();
      setGenerationTime(endTime - startTime);
      setIsLoading(false);
    }
  };


  const handleExpandMindMapSection = async (sectionTitle: string, sectionTypes: MindMapNode['type'][]) => {
    if (!currentTopic || !mindMapData) return;

    setIsExpandingMindMap(sectionTitle);
    const agentInstruction = selectedAgent?.systemInstruction || 'You are an encyclopedia. Provide detailed, neutral, and well-structured information.';
    try {
        const existingNodes = mindMapData.nodes.filter(node => sectionTypes.includes(node.type));
        const newNodes = await expandMindMapSection(currentTopic, sectionTitle, existingNodes, agentInstruction);

        setMindMapData(prevData => {
            if (!prevData) return null;
            const existingNodeIds = new Set(prevData.nodes.map(n => n.id));
            const uniqueNewNodes = newNodes.filter(n => !existingNodeIds.has(n.id));
            return {
                ...prevData,
                nodes: [...prevData.nodes, ...uniqueNewNodes]
            };
        });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while expanding.';
        setError(errorMessage); 
        console.error(e);
    } finally {
        setIsExpandingMindMap(null);
    }
  };

  const handleFollowUpSubmit = async (message: string, modelName?: string, isDeepSearch?: boolean) => {
    setIsChatLoading(true);

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);

    let accumulatedResponse = '';
    const modelMessageIndex = newMessages.length;
    const agentInstruction = selectedAgent?.systemInstruction || 'You are an encyclopedia. Provide detailed, neutral, and well-structured information.';

    try {
      for await (const chunk of streamChatResponse(currentTopic || 'General Conversation', message, isMemoryEnabled ? messages : [], agentInstruction, undefined, taskCallbacks, modelName, isDeepSearch)) {
        if (chunk.textChunk) {
          accumulatedResponse += chunk.textChunk;
          setMessages(prev => {
            const updated = [...prev];
            if (updated[modelMessageIndex]) {
              updated[modelMessageIndex].content = accumulatedResponse;
            } else {
              updated.push({ role: 'model', content: accumulatedResponse });
            }
            return updated;
          });
        }
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred during follow-up.';
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsChatLoading(false);
    }
  };
  
  const handleDebateFollowUpStart = (turnIndex: number, agent: AgentProfile) => {
    setDebateFollowUp({ turnIndex, agent, messages: [] });
  };

  const handleDebateFollowUpSubmit = async (message: string, modelName?: string, isDeepSearch?: boolean) => {
    if (!currentTopic || !debateFollowUp) return;
    
    setIsChatLoading(true);
    const { agent, messages: followUpMessages, turnIndex } = debateFollowUp;

    const newMessages: ChatMessage[] = [...followUpMessages, { role: 'user', content: message }];
    setDebateFollowUp(prev => prev ? { ...prev, messages: newMessages } : null);

    let accumulatedResponse = '';
    const modelMessageIndex = newMessages.length;
    
    const turn = debateTurns[turnIndex];
    const context = `You are in a debate about "${currentTopic}". You just said: "${turn.statement}". Now, answer the user's follow-up question about that statement.`;

    try {
      for await (const chunk of streamChatResponse(currentTopic, message, isMemoryEnabled ? followUpMessages : [], agent.systemInstruction, context, taskCallbacks, modelName, isDeepSearch)) {
        if (chunk.textChunk) {
          accumulatedResponse += chunk.textChunk;
          setDebateFollowUp(prev => {
            if (!prev) return null;
            const updatedMessages = [...prev.messages];
            if (updatedMessages[modelMessageIndex]) {
              updatedMessages[modelMessageIndex].content = accumulatedResponse;
            } else {
              updatedMessages.push({ role: 'model', content: accumulatedResponse });
            }
            return { ...prev, messages: updatedMessages };
          });
        }
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred during follow-up.';
      setDebateFollowUp(prev => {
        if (!prev) return null;
        return { ...prev, messages: [...prev.messages, { role: 'model', content: errorMessage }] };
      });
    } finally {
      setIsChatLoading(false);
    }
  };


  const handleAgentSelect = (agent: AgentProfile) => {
    setSelectedAgent(agent);
    setIsAgentsPopupOpen(false);
  };
  
  const isDownloadable = !isLoading && (content || debateTurns.length > 0 || mindMapData || quizData || bookListData || flashcardsData);

  return (
    <div className="h-full">
      {isTasksPageOpen ? (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-12">
            <div className="title-container">
              <button onClick={() => setIsTasksPageOpen(false)} className="back-button" aria-label="Go back">
                &larr;
              </button>
              <h1>kinich</h1>
            </div>
            <div className="date-display">{currentDate}</div>
            <div className="mt-8 text-center">
              <h2 className="text-3xl font-serif">Tasks for kinich-liora</h2>
              <p className="text-muted-foreground mt-2">Manage your research tasks and let kinich help you stay organized.</p>
            </div>
          </header>
          <TaskBoard 
            tasks={tasks}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        </div>
      ) : isChatPageOpen ? (
        <div className="w-full h-screen fixed inset-0 bg-[#F4F3ED] flex flex-col z-[100] overflow-hidden">
          {/* Background Mayan SVG patterns */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] flex flex-wrap gap-16 justify-center items-center overflow-hidden z-0">
             {Array.from({ length: 30 }).map((_, i) => (
                <svg key={i} width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className={i % 3 === 0 ? "scale-125" : i % 2 === 0 ? "scale-75" : ""}>
                  {i % 4 === 0 ? (
                    // Stepped pyramid
                    <>
                      <path d="M10 90 L10 70 L30 70 L30 50 L40 50 L40 30 L60 30 L60 50 L70 50 L70 70 L90 70 L90 90 Z" />
                      <rect x="45" y="30" width="10" height="20" />
                      <circle cx="50" cy="15" r="5" />
                      <path d="M20 70 L20 90" /><path d="M80 70 L80 90" />
                    </>
                  ) : i % 4 === 1 ? (
                    // Mayan mask/face
                    <>
                      <rect x="25" y="25" width="50" height="50" rx="5" />
                      <rect x="35" y="40" width="10" height="10" /><rect x="55" y="40" width="10" height="10" />
                      <path d="M40 65 L60 65" /><path d="M50 40 L50 60" />
                      <rect x="15" y="35" width="10" height="30" /><rect x="75" y="35" width="10" height="30" />
                      <path d="M35 15 L35 25" /><path d="M50 10 L50 25" /><path d="M65 15 L65 25" />
                    </>
                  ) : i % 4 === 2 ? (
                    // Another geometric temple
                    <>
                      <path d="M10 90 h80 v-10 h-10 v-10 h-10 v-20 h-10 v-20 h-20 v20 h-10 v20 h-10 v10 h-10 z" />
                      <rect x="35" y="50" width="30" height="40" />
                      <path d="M45 50 v40" /><path d="M55 50 v40" />
                    </>
                  ) : (
                    // Original steps
                    <>
                      <path d="M10 90 L10 10 L30 10 L30 30 L50 30 L50 50 L70 50 L70 70 L90 70 L90 90 Z" />
                      <rect x="20" y="80" width="10" height="10" />
                      <rect x="40" y="60" width="10" height="10" />
                      <rect x="60" y="40" width="10" height="10" />
                      <circle cx="70" cy="20" r="8" />
                    </>
                  )}
                </svg>
             ))}
          </div>

          <div className="absolute top-6 left-6 z-20">
             <button onClick={() => setIsChatPageOpen(false)} className="w-12 h-12 bg-[#EAE8E3]/80 backdrop-blur-md rounded-[16px] flex items-center justify-center text-[#292929] hover:bg-[#EAE8E3] transition-colors shadow-sm border border-black/5" aria-label="Go back">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M13 19l-7-7 7-7"/><path d="M22 12H6"/></svg>
             </button>
          </div>

          <div className="flex-1 w-full relative z-10 overflow-hidden">
            <ChatInterface
              messages={messages}
              onSendMessage={handleFollowUpSubmit}
              isLoading={isChatLoading}
            />
          </div>
        </div>
      ) : isLearningActive && currentTopic ? (
          <LearningJournal topic={currentTopic} onClose={handleCloseLearning} />
      ) : (
        <>
        <header>
          <div className="title-container">
            {(currentTopic || browserQuery) && (
              <button onClick={handleGoBackToDiscover} className="back-button" aria-label="Go back to discover topics">
                &larr;
              </button>
            )}
            <h1>kinich</h1>
          </div>
          <div className="date-display">{currentDate}</div>
          <SearchBar 
            onSearch={handleSearch} 
            onSearchResultSelect={handleSearchResultSelect}
            onRandom={handleSurpriseMe} 
            onDiscover={handleDiscover}
            isLoading={isLoading || isRefreshingTopics}
            isWebSearchEnabled={isWebSearchEnabled}
            onWebSearchToggle={setIsWebSearchEnabled}
            isLearningMode={isLearningMode}
            onToggleLearnMode={() => setIsLearningMode(!isLearningMode)}
            onAgentsToggle={() => setIsAgentsPopupOpen(true)}
            onChatToggle={() => {
              setIsChatPageOpen(true);
              setIsTasksPageOpen(false);
            }}
            onTasksToggle={() => {
              setIsTasksPageOpen(true);
              setIsChatPageOpen(false);
            }}
            onSettingsToggle={() => setIsSettingsOpen(true)}
            selectedAgentName={selectedAgent?.name || 'None'}
          />
        </header>
        
        <main className="flex gap-6">
          {browserQuery && !currentTopic ? (
             <div className="flex-1 min-w-0">
               <div className="browser-header mb-8 pb-4 border-b border-border/50">
                  <h2 className="text-4xl font-serif font-bold italic">{browserQuery}</h2>
                  <p className="text-muted-foreground mt-2">Showing direct links, images, and videos from the web.</p>
               </div>
               <MediaBrowser 
                 query={browserQuery}
                 isImageSearchEnabled={true}
                 isVideoSearchEnabled={true}
                 isWebSearchEnabled={true}
                 onResultClick={(title, url) => {
                    handleSearchResultSelect({ title, url, content: '', engine: 'Browser' });
                 }}
               />
             </div>
          ) : currentTopic ? (
            // ARTICLE / CONTENT VIEW
            <div className="flex-1 min-w-0">
              <div className="topic-header">
                <div className="flex items-center gap-4">
                  <h2>{currentTopic}</h2>
                  <button 
                    onClick={() => toggleBookmark(currentTopic!, currentArxivId || undefined)}
                    className={`bookmark-toggle-btn ${isCurrentTopicBookmarked ? 'active' : ''}`}
                    aria-label={isCurrentTopicBookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isCurrentTopicBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                  </button>
                  <a href="#media-gallery" className="text-[10px] uppercase tracking-widest px-3 py-1 bg-accent-color/10 rounded-full text-accent-color hover:bg-accent-color/20 transition-all font-mono font-bold">
                    Media Gallery
                  </a>
                </div>
              </div>
              
              {isDownloadable && (
                <div className="download-bow-container">
                  <button
                    className="download-bow-button"
                    aria-label="Download content"
                    onClick={() => setIsDownloadPopupOpen(true)}
                  >
                    <svg width="80" height="120" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Bow - Organic vine-like shape */}
                      <path
                        d="M30 15 C 60 50, 60 70, 30 105"
                        className="bow-stroke"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M50 15 C 20 50, 20 70, 50 105"
                        className="bow-stroke"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />

                      {/* Arrow - Downward pointing */}
                      <path d="M40 5 V 115" className="bow-stroke" strokeWidth="1.5" />
                      {/* Arrowhead */}
                      <path d="M35 108 L 40 115 L 45 108" className="bow-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Fletching (Feathers) */}
                      <g className="bow-stroke" strokeWidth="1" strokeLinecap="round">
                        <path d="M40 10 C 45 15, 48 20, 40 25" />
                        <path d="M40 10 C 35 15, 32 20, 40 25" />
                        <path d="M43 13 L 40 16 L 37 13" />
                        <path d="M43 18 L 40 21 L 37 18" />
                      </g>
                      
                      {/* Central Flower */}
                      <g transform="translate(40, 60)">
                        {/* Petals */}
                        <path d="M0,0 C-10,-5 -5,-15 0,-12 C5,-15 10,-5 0,0 Z" className="flower-fill bow-stroke" strokeOpacity="0.7" />
                        <path d="M0,0 C-10,5 -5,15 0,12 C5,15 10,5 0,0 Z" className="flower-fill bow-stroke" strokeOpacity="0.7" />
                        <path d="M0,0 C5,-10 15,-5 12,0 C15,5 5,10 0,0 Z" className="flower-fill bow-stroke" strokeOpacity="0.7" />
                        <path d="M0,0 C-5,-10 -15,-5 -12,0 C-15,5 -5,10 0,0 Z" className="flower-fill bow-stroke" strokeOpacity="0.7" />
                        {/* Center */}
                        <circle cx="0" cy="0" r="4" className="flower-fill" />
                      </g>

                      {/* Leaves */}
                      <g className="bow-stroke" strokeWidth="1" strokeLinecap="round">
                          <path d="M28 45 C 35 48, 38 40, 28 45" />
                          <path d="M52 45 C 45 48, 42 40, 52 45" />
                          <path d="M28 75 C 35 72, 38 80, 28 75" />
                          <path d="M52 75 C 45 72, 42 80, 52 75" />
                      </g>
                    </svg>
                  </button>

                  {isDownloadPopupOpen && (
                    <DownloadPopup
                      topic={currentTopic}
                      content={content}
                      debateTurns={debateTurns}
                      mindMapData={mindMapData}
                      quizData={quizData}
                      flashcardsData={flashcardsData}
                      bookListData={bookListData}
                      onClose={() => setIsDownloadPopupOpen(false)}
                    />
                  )}
                </div>
              )}

              {showActionPopup && <ActionPopup onSelect={handleActionSelect} />}

              {error && !isLoading && (
                <div style={{ border: `1px solid var(--accent-color)`, padding: '1rem', color: `var(--accent-color)` }}>
                  <p style={{ margin: 0, fontFamily: `var(--font-heading)` }}>An Error Occurred</p>
                  <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
                </div>
              )}
              
              {isLoading && !content && !quizData && !mindMapData && !bookListData && debateTurns.length === 0 && !flashcardsData && (
                <LoadingSkeleton progress={loadingProgress} />
              )}
              
              {quizData && !isLoading && <QuizDisplay quiz={quizData} />}

              {flashcardsData && !isLoading && <FlashcardDisplay flashcards={flashcardsData} topic={currentTopic} />}
              
              {bookListData && !isLoading && <BookFinderDisplay books={bookListData} />}

              {mindMapData && !isLoading && (
                <MindMapDisplay 
                  data={mindMapData} 
                  onExpandSection={handleExpandMindMapSection}
                  expandingSection={isExpandingMindMap}
                />
              )}

              {isDebateSetupActive && !isLoading && (
                <DebateSetup agents={AGENTS} onStartDebate={handleStartDebate} />
              )}

              {debateTurns.length > 0 && !isLoading && (
                <>
                  <DebateDisplay 
                    turns={debateTurns}
                    debatingAgents={debatingAgents}
                    onFollowUp={handleDebateFollowUpStart}
                  />
                  {debateFollowUp && (
                    <ChatInterface
                      messages={debateFollowUp.messages}
                      onSendMessage={handleDebateFollowUpSubmit}
                      isLoading={isChatLoading}
                      title={`Follow up with ${debateFollowUp.agent.name}`}
                    />
                  )}
                </>
              )}

              {content && !mindMapData && !bookListData && (
                 <>
                   <ThinkingDropdown 
                     thoughts={thoughts} 
                     duration={thinkingDuration} 
                     isThinking={isThinking} 
                   />
                   <ContentDisplay 
                     topic={currentTopic}
                     title={contentTitle}
                     content={content} 
                     isLoading={isLoading} 
                     sources={sources}
                     paperDetails={paperDetails}
                     isImageSearchEnabled={true}
                     isVideoSearchEnabled={true}
                   />
                 </>
              )}

              {isFollowUpActive && !isLoading && !debateFollowUp && (
                <ChatInterface 
                  messages={messages}
                  onSendMessage={handleFollowUpSubmit}
                  isLoading={isChatLoading}
                  title="Ask a follow-up question"
                />
              )}
            </div>
          ) : (
            // DISCOVER VIEW
            <div className="flex-1 min-w-0">
               {/* Recently Viewed Section */}
               {recentlyViewed.length > 0 && (
                <section className="discover-section recently-viewed-section mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                       </svg>
                       Recently Viewed
                    </h3>
                    <button 
                      onClick={() => setRecentlyViewed([])}
                      className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent-color transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentlyViewed.map((item) => (
                      <div 
                        key={`${item.id}-${item.timestamp}`}
                        className="bookmark-card p-4 border border-border/50 rounded-lg scale-95 hover:scale-100 hover:border-accent-color/50 transition-all group cursor-pointer"
                        onClick={() => handleTopicSelection(item.title, item.type === 'paper', item.arxivId)}
                      >
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                          {item.type === 'paper' ? 'Academic Paper' : 'Topic'}
                        </div>
                        <h4 className="font-heading text-lg leading-tight group-hover:text-accent-color transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="mt-3 text-[10px] text-muted-foreground/60 italic">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {bookmarks.length > 0 && (
                <section className="discover-section bookmarks-section mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                      </svg>
                      Saved for Later
                    </h3>
                    <button 
                      onClick={() => {
                        if (confirm('Clear all bookmarks?')) setBookmarks([]);
                      }}
                      className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent-color transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="bookmark-card p-4 border border-border/50 rounded-lg hover:border-accent-color/50 transition-all group relative">
                        <button 
                          onClick={() => handleTopicSelection(bookmark.topic, bookmark.type === 'paper', bookmark.arxivId)}
                          className="text-left w-full pr-8"
                        >
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                            {bookmark.type === 'paper' ? 'Academic Paper' : 'Topic'}
                          </div>
                          <h4 className="font-heading text-lg leading-tight group-hover:text-accent-color transition-colors line-clamp-2">
                            {bookmark.title}
                          </h4>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(bookmark.topic, bookmark.arxivId);
                          }}
                          className="absolute top-4 right-4 text-muted-foreground hover:text-accent-color transition-colors"
                          aria-label="Remove bookmark"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {isRefreshingTopics ? (
                <LoadingSkeleton />
              ) : error ? (
                  <div style={{ border: `1px solid var(--accent-color)`, padding: '1rem', color: `var(--accent-color)` }}>
                    <p style={{ margin: 0, fontFamily: `var(--font-heading)` }}>An Error Occurred</p>
                    <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
                  </div>
              ) : trendingTopics ? (
                <div>
                  <div className="mb-8">
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                       <input 
                         type="text" 
                         value={newCategoryName} 
                         onChange={(e) => setNewCategoryName(e.target.value)} 
                         placeholder="A specific branch of study (e.g. Quantum Computing)" 
                         className="flex-1 bg-muted/50 border border-border/50 text-foreground px-4 py-2 rounded-md focus:outline-none focus:border-accent-color text-sm"
                         disabled={loadingCategory !== null}
                       />
                       <button 
                         type="submit" 
                         disabled={loadingCategory !== null}
                         className="px-4 py-2 bg-accent-color text-white rounded-md text-sm font-medium hover:bg-accent-color/90 disabled:opacity-50"
                       >
                         {loadingCategory === newCategoryName.trim() ? "Loading..." : "Add Branch"}
                       </button>
                    </form>
                  </div>
                  {Object.entries(trendingTopics).map(([category, papers]) => (
                    <section key={category} className="discover-section">
                      <h3>{category}</h3>
                      {(papers as Paper[]).map((paper, index) => (
                        <article key={index} className="discover-paper relative group">
                          <div className="flex justify-between items-start gap-4">
                            <button onClick={() => handleTopicSelection(paper.title, !!paper.arxivId, paper.arxivId, paper.sourceLink)} className="paper-title text-left flex-1">
                              {paper.title}
                            </button>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => toggleLike(paper.arxivId)}
                                className="p-1.5 -mt-1 text-muted-foreground hover:text-red-500 transition-colors"
                                aria-label="Like"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={likedPapers.includes(paper.arxivId) ? "#ef4444" : "none"} stroke={likedPapers.includes(paper.arxivId) ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => toggleBookmark(paper.title, paper.arxivId)}
                                className={`bookmark-toggle-btn p-1.5 -mt-1 ${bookmarks.some(b => b.id === paper.arxivId) ? 'active' : ''}`}
                                aria-label={bookmarks.some(b => b.id === paper.arxivId) ? "Remove bookmark" : "Add bookmark"}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarks.some(b => b.id === paper.arxivId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="paper-meta">
                            <p className="paper-authors">{(Array.isArray(paper.authors) ? paper.authors : [paper.authors]).filter(Boolean).join(', ')} · {paper.publishedDate}</p>
                            {paper.arxivId && paper.sourceLink && (
                              <a href={paper.sourceLink} target="_blank" rel="noopener noreferrer" className="paper-id-link">
                                Source
                              </a>
                            )}
                          </div>
                          <p className="paper-summary">{paper.summary}</p>
                        </article>
                      ))}
                      <div className="mt-4 flex justify-center">
                         <button 
                             onClick={() => handleLoadMoreCategory(category)}
                             disabled={loadingCategory === category}
                             className="text-xs uppercase tracking-widest px-4 py-2 border border-border/50 rounded-md hover:border-accent-color text-muted-foreground hover:text-foreground transition-colors"
                         >
                             {loadingCategory === category ? "Loading..." : "Load More"}
                         </button>
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                !isRefreshingTopics && <div>No trending topics could be found.</div>
              )}
            </div>
          )}
          
        </main>

        <footer className="mt-20 py-12 border-t border-border/30 bg-muted/20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tighter">kinich</span>
              <span className="text-xs text-muted-foreground">© 2026</span>
            </div>
            
            <div className="flex gap-8 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <button 
                onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </button>
              <a href="mailto:support@kinich-app.example" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest text-center md:text-right">
              {/* Footer text removed per request */}
            </div>
          </div>
        </footer>
        </>
      )}

      <AgentsPopup
        isOpen={isAgentsPopupOpen}
        onClose={() => setIsAgentsPopupOpen(false)}
        agents={AGENTS}
        onAgentSelect={handleAgentSelect}
        currentAgentId={selectedAgent?.id || 'neutral'}
      />

      <LegalModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
      />

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        isMemoryEnabled={isMemoryEnabled}
        onMemoryToggle={setIsMemoryEnabled}
        currentTheme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
};

export default App;
