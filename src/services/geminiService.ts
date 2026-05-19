/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { AgentProfile } from '@/components/AgentsPopup';

// Standardize and hide API interaction behind server-side proxy
async function* streamFromServer(
  endpoint: string, 
  body: any
): AsyncGenerator<any, void, undefined> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') return;
        try {
          yield JSON.parse(dataStr);
        } catch (e) {
          console.error("Error parsing event data:", e);
        }
      }
    }
  }
}

const textModelName = 'longcat';

export interface PaperDetails {
  authors: string[];
  submittedDate: string;
  abstract: string;
}

export interface StreamChunk {
  textChunk?: string;
  thoughtChunk?: string;
  sources?: any[];
  metadata?: PaperDetails;
}

export interface Paper {
  title: string;
  authors: string[];
  summary: string;
  publishedDate: string;
  arxivId: string;
  sourceLink: string;
}

export interface TrendingTopics {
  [category: string]: Paper[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface SyllabusItem {
  title: string;
  description: string;
}

export interface NotebookPage {
  title: string;
  content: string;
}

export interface MindMapNode {
  id: string;
  title: string;
  content: string;
  type: 'inspiration' | 'core_concept' | 'innovation' | 'impact' | 'key_figure' | 'related_work';
}

export interface MindMapData {
  topic: string;
  abstract: string;
  nodes: MindMapNode[];
}

export interface Book {
  title: string;
  authors: string[];
  description: string;
  link: string;
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: number;
}

export interface DebateTurn {
  agentName: string;
  statement: string;
}


export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine?: string;
  publishedDate?: string;
  thumbnail?: string;
}

/**
 * Searches an external SearXNG instance for relevant articles and information.
 * @param query The search query.
 * @param categories The categories to search (e.g., 'academic', 'science').
 * @returns A promise that resolves to an array of SearchResult objects.
 */
export async function searchExternal(query: string, categories: string[] = ['general', 'science']): Promise<SearchResult[]> {
  try {
    const url = new URL('/api/search', window.location.origin);
    url.searchParams.append('q', query);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Proxy request failed with status ${response.status}`);
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((res: any) => ({
      title: res.title,
      url: res.url,
      content: res.content
    }));
  } catch (error) {
    console.error('Error fetching from DuckDuckGo HTML API:', error);
    return [];
  }
}

export async function getAutocompleteSuggestions(query: string): Promise<SearchResult[]> {
    try {
        const url = new URL('/api/search_suggestions', window.location.origin);
        url.searchParams.append('q', query);
        const response = await fetch(url.toString());
        if (!response.ok) return [];
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        return data.map((res: any) => ({
            title: res.phrase || res.title,
            url: '',
            content: ''
        }));
    } catch {
        return [];
    }
}

/**
 * Streams a definition for a given topic from the Gemini API.
 * @param topic The word or term to define.
 * @param useWebSearch Whether to enable Google Search grounding.
 * @param isPaper Whether the topic is a paper title requiring metadata.
 * @param url Optional URL to fetch content from.
 * @returns An async generator that yields text chunks, sources, and metadata.
 */
export async function* streamDefinition(
  topic: string,
  useWebSearch: boolean,
  isPaper: boolean,
  url?: string,
): AsyncGenerator<StreamChunk, void, undefined> {
  let paperPrompt = `You are kinich, an AI research assistant. For the paper titled "${topic}"${url ? ` found at ${url}` : ''}, generate a realistic set of metadata (authors, submittedDate in "Month Day, Year" format, a detailed abstract) and the full article text. First, provide the metadata as a single-line JSON object prefixed with "METADATA_JSON::". Example: METADATA_JSON::{"authors":["Dr. Evelyn Reed"],"submittedDate":"October 26, 2023","abstract":"..."}. Immediately after the JSON line, provide the full, comprehensive article text based on the source content. Do not use markdown.`;
  let generalPrompt = `Write a detailed, comprehensive, and engaging article about the topic: "${topic}"${url ? ` based on the content at ${url}` : ''}. The article should be well-structured and suitable for an encyclopedia. Cover its history, key concepts, significance, and modern applications. If a URL is provided, prioritize internalizing and explaining its content. Ensure the tone is informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the article itself.`;

  if (useWebSearch || url) {
    paperPrompt = `You are kinich, an AI research assistant. For the paper titled "${topic}"${url ? ` at ${url}` : ''}, use web search to find and analyze it${url ? '' : ', prioritizing results from academic repositories'}. Generate a realistic set of metadata (authors, submittedDate in "Month Day, Year" format, a detailed abstract) and the full article text based on your findings. First, provide the metadata as a single-line JSON object prefixed with "METADATA_JSON::". Example: METADATA_JSON::{"authors":["Dr. Evelyn Reed"],"submittedDate":"October 26, 2023","abstract":"..."}. Immediately after the JSON line, provide the full, comprehensive article text based on information from the source. Do not use markdown.`;
    generalPrompt = `Write a detailed, comprehensive, and engaging article about: "${topic}"${url ? ` specifically analyzing the content at ${url}` : ''}. The article should be well-structured and suitable for an encyclopedia. When using web search, you must prioritize and cite information from high-quality sources. Cover its history, key concepts, significance, and modern applications. Ensure the tone is informative and neutral. Do not use markdown, titles, or any special formatting. Respond with only the text of the article itself.`;
  }
  
  const prompt = isPaper ? paperPrompt : generalPrompt;

  try {
    const stream = streamFromServer('/api/gemini/stream', {
      model: textModelName,
      prompt: prompt,
      config: {
        tools: (useWebSearch || url) ? [{googleSearch: {}}] : [],
      }
    });
    
    const allSources: any[] = [];
    const sourceUris = new Set<string>();
    let metadataParsed = false;
    let buffer = '';

    for await (const chunk of stream) {
      if (chunk.text) {
        if (isPaper && !metadataParsed) {
          buffer += chunk.text;
          const endOfLineIndex = buffer.indexOf('\n');
          if (endOfLineIndex !== -1) {
            const firstLine = buffer.substring(0, endOfLineIndex);
            if (firstLine.startsWith('METADATA_JSON::')) {
              const jsonStr = firstLine.replace('METADATA_JSON::', '');
              try {
                const metadata: PaperDetails = JSON.parse(jsonStr);
                yield { metadata };
              } catch (e) {
                console.error("Failed to parse metadata JSON:", e);
              }
            }
            const remainingText = buffer.substring(endOfLineIndex + 1);
            if (remainingText) {
              yield { textChunk: remainingText };
            }
            metadataParsed = true;
          }
        } else {
          yield { textChunk: chunk.text };
        }
      }

      const newSources = chunk.groundingMetadata?.groundingChunks;
      if (newSources) {
        let sourcesUpdated = false;
        for (const source of newSources) {
          if (source.web && source.web.uri && !sourceUris.has(source.web.uri)) {
            sourceUris.add(source.web.uri);
            allSources.push(source);
            sourcesUpdated = true;
          }
        }
        if (sourcesUpdated) {
          yield { sources: [...allSources] };
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini Proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    yield { textChunk: `Error: ${errorMessage}` };
    throw new Error(errorMessage);
  }
}


/**
 * Generates a mind map structure for a given topic.
 * @param topic The topic to deconstruct.
 * @param isPaper Whether the topic is an academic paper.
 * @param agentInstruction The system instruction for the AI agent.
 * @returns A promise that resolves to a MindMapData object.
 */
export async function getArticleMindMap(topic: string, isPaper: boolean, agentInstruction: string): Promise<MindMapData> {
  const prompt = `
    Analyze the provided topic: "${topic}".
    The topic is ${isPaper ? 'an academic paper' : 'a general concept'}.
    Your task is to generate an intellectual overview.

    First, write a concise, one-paragraph abstract that summarizes the core concepts of the topic in an easy-to-understand way.

    Then, deconstruct this topic into a "mind map" or an "intellectual genealogy", breaking it down into its constituent parts, showing the flow of ideas from inspiration to innovation and impact.

    Structure your response as a JSON object with three keys: "topic", "abstract", and "nodes".

    - "topic": A string with the main topic name.
    - "abstract": The summary paragraph you just wrote.
    - "nodes": An array of node objects.

    Each node object in the array must have the following properties:
    1. "id": A unique, simple string identifier (e.g., "inspiration-1", "core-1").
    2. "title": A short, descriptive title for the idea or component.
    3. "content": A detailed paragraph explaining this component. This content should be self-contained and clearly written.
    4. "type": A category for the node. Choose from one of the following exact strings: "inspiration", "core_concept", "innovation", "impact", "key_figure", "related_work".

    Please generate a rich and interconnected set of nodes.
    - For "inspiration", describe the precursor ideas, earlier works, or problems that led to this development.
    - For "key_figure", describe the main people involved.
    - For "core_concept", explain the central idea or mechanism of the topic in detail. There should be at least one "core_concept" node.
    - For "innovation", detail the novel contributions or breakthroughs.
    - For "impact", explain the consequences, applications, or influence on later work.
    - For "related_work", mention other contemporary or subsequent works that are relevant.

    Ensure the "content" of each node is comprehensive and helps the user understand that specific part of the story. Do not use markdown in the content.
    
    IMPORTANT: While generating this response, you must strictly adhere to your assigned persona as defined in the system instructions. Do not break character or deviate from the specified perspective.
  `;

  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        prompt: prompt,
        config: {
          systemInstruction: agentInstruction,
        }
      })
    });

    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    const data = await response.json();
    if (!data.text) throw new Error("No text response from proxy");
    
    return JSON.parse(data.text.trim()) as MindMapData;
  } catch (error) {
    console.error('Error getting mind map from Proxy:', error);
    throw new Error('Failed to generate mind map.');
  }
}

/**
 * Expands a section of the mind map with more nodes.
 * @param topic The main topic of the mind map.
 * @param sectionTitle The title of the section to expand (e.g., 'Inspirations & Precursors').
 * @param existingNodes The nodes already present in that section.
 * @param agentInstruction The system instruction for the AI agent.
 * @returns A promise that resolves to an array of new MindMapNode objects.
 */
export async function expandMindMapSection(
  topic: string,
  sectionTitle: string,
  existingNodes: MindMapNode[],
  agentInstruction: string
): Promise<MindMapNode[]> {
  const existingTitles = existingNodes.map(n => n.title).join(', ');
  const nodeTypes = [...new Set(existingNodes.map(n => n.type))].join(', ');

  const prompt = `
    The user is exploring a mind map about the topic "${topic}".
    They want to see more content for the section titled "${sectionTitle}".
    This section currently contains the following items: ${existingTitles}.
    The types of nodes in this section are: ${nodeTypes}.

    Your task is to generate 2-3 new, distinct nodes that expand upon this section.
    Do not repeat the existing items. The new nodes should provide deeper insight or broader context.
    
    Return a JSON array of node objects. Each object must have:
    1. "id": A unique string identifier (e.g., "${nodeTypes[0]}-${Math.random()}").
    2. "title": A short, descriptive title.
    3. "content": A detailed paragraph.
    4. "type": A category string, which must be one of the relevant types for this section: ${nodeTypes}.

    IMPORTANT: While generating this response, you must strictly adhere to your assigned persona as defined in the system instructions.
  `;
  
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        prompt: prompt,
        config: {
          systemInstruction: agentInstruction,
        }
      })
    });

    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    const data = await response.json();
    if (!data.text) throw new Error("No text response from proxy");
    
    return JSON.parse(data.text.trim()) as MindMapNode[];
  } catch (error) {
    console.error('Error expanding mind map section from Proxy:', error);
    throw new Error('Failed to expand mind map section.');
  }
}


/**
 * Finds related books and academic resources for a given topic using web search.
 * @param topic The topic to find books about.
 * @returns A promise that resolves to an array of Book objects.
 */
export async function findRelatedBooks(topic: string): Promise<Book[]> {
  const prompt = `
    For the topic "${topic}", find 5-7 highly relevant and influential books, seminal academic papers, or comprehensive textbooks.
    Use web search to find accurate information. For each item, provide its title, authors, a concise one-paragraph description, and a direct, publicly accessible URL where the user can download a PDF version.
    Prioritize links that end in ".pdf" from reputable sources like academic repositories.
    Respond with ONLY a valid JSON array of objects. Each object must have "title" (string), "authors" (an array of strings), "description" (string), and "link" (string).
  `;

  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        prompt: prompt,
        config: {
          tools: [{googleSearch: {}}],
        }
      })
    });
    
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
    const data = await response.json();
    if (!data.text) return [];

    let jsonString = data.text.trim();
    const jsonStartIndex = jsonString.indexOf('[');
    const jsonEndIndex = jsonString.lastIndexOf(']');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
    } else {
      return [];
    }

    return JSON.parse(jsonString) as Book[];
  } catch (error) {
    console.error('Error finding related books from Proxy:', error);
    return [];
  }
}


/**
 * Streams enhanced content like summaries or chain-of-thought explanations.
 * @param topic The topic to generate content for.
 * @param mode 'summary' or 'cot' (Chain-of-Thought).
 * @param agentInstruction The system instruction for the AI agent.
 * @returns An async generator that yields text chunks.
 */
export async function* streamEnhancedContent(
  topic: string,
  mode: 'summary' | 'cot',
  agentInstruction: string,
): AsyncGenerator<StreamChunk, void, undefined> {
  let prompt = '';
  if (mode === 'summary') {
    prompt = `Provide a concise, easy-to-understand summary of the topic: "${topic}". Focus on the most critical points. Do not use markdown. IMPORTANT: Strictly adhere to your assigned persona as defined in the system instructions.`;
  } else { // Chain-of-Thought
    prompt = `Provide a "chain-of-thought" explanation for the topic: "${topic}". Enclose thinking in <thinking> tags. Do not use markdown for final output. Adhere to persona.`;
  }

  try {
    const stream = streamFromServer('/api/gemini/stream', {
      model: textModelName,
      prompt: prompt,
      systemInstruction: agentInstruction,
      config: { 
        tools: [{googleSearch: {}}],
      },
    });
    
    let buffer = '';
    let isThinking = false;
    let finishedThinking = false;

    for await (const chunk of stream) {
      if (chunk.text) {
        let text = chunk.text;
        
        if (mode === 'cot') {
          if (!finishedThinking) {
            buffer += text;
            if (!isThinking && buffer.includes('<thinking>')) {
              isThinking = true;
              buffer = buffer.substring(buffer.indexOf('<thinking>') + '<thinking>'.length);
            }
            if (isThinking && buffer.includes('</thinking>')) {
              const endIndex = buffer.indexOf('</thinking>');
              yield { thoughtChunk: buffer.substring(0, endIndex) };
              const remaining = buffer.substring(endIndex + '</thinking>'.length);
              finishedThinking = true;
              isThinking = false;
              buffer = '';
              if (remaining) yield { textChunk: remaining };
            } else if (isThinking && buffer.length > 20) {
              yield { thoughtChunk: buffer.substring(0, buffer.length - 15) };
              buffer = buffer.substring(buffer.length - 15);
            }
          } else {
            yield { textChunk: text };
          }
        } else {
          yield { textChunk: text };
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    yield { textChunk: `Error: ${errorMessage}` };
    throw new Error(errorMessage);
  }
}


/**
 * Generates a multiple-choice quiz for a given topic.
 * @param topic The topic of the quiz.
 * @param agentInstruction The system instruction for the AI agent.
 * @returns A promise that resolves to a Quiz object.
 */
export async function getQuiz(topic: string, agentInstruction: string): Promise<Quiz> {
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        prompt: `Create a 10-question multiple-choice quiz about "${topic}". JSON object with title and questions (question, options[], answer).`,
        config: { systemInstruction: agentInstruction }
      })
    });
    const data = await response.json();
    return JSON.parse(data.text.trim()) as Quiz;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to generate quiz.');
  }
}

/**
 * Generates a set of flashcards for a given topic.
 * @param topic The topic of the flashcards.
 * @param agentInstruction The system instruction for the AI agent.
 * @returns A promise that resolves to an array of Flashcard objects.
 */
export async function getFlashcards(topic: string, agentInstruction: string): Promise<Flashcard[]> {
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        prompt: `Create 10-15 flashcards for "${topic}". JSON array with question and answer.`,
        config: { systemInstruction: agentInstruction }
      })
    });
    const data = await response.json();
    return JSON.parse(data.text.trim()) as Flashcard[];
  } catch (error) {
    console.error(error);
    throw new Error('Failed to generate flashcards.');
  }
}


/**
 * Generates a list of trending academic/scientific topics, structured by category.
 * @returns A promise that resolves to an object with categories as keys and arrays of papers as values.
 */
export async function getTrendingTopics(): Promise<TrendingTopics> {
  const categories = [
    "Theoretical Physics & Cosmology", 
    "Artificial Intelligence & Robotics", 
    "Computational Biology & Bioinformatics",
    "Psychology & Neuroscience",
    "Arts & Culture"
  ];
  const prompt = `Use web search. Find 4 real, trending articles, papers, or posts from any source for these categories: ${categories.map(c => `"${c}"`).join(', ')}. For each item, provide title, authors (array of strings), one-sentence summary, publishedDate, an 'arxivId' (unique short ID/hash), and sourceLink. Respond with ONLY a valid JSON map where keys are category names and values are arrays of paper objects. Just return the raw JSON object string.`;

  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'longcat',
        prompt: prompt,
        config: {
          tools: [{googleSearch: {}}],
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server proxy failed with status ${response.status}`);
    }

    const data = await response.json();
    let text = data.text.trim();
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3);
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3);
    }
    
    if (text) {
      return JSON.parse(text.trim()) as TrendingTopics;
    }
  } catch (error) {
    console.error('Error getting trending topics from LongCat:', error);
  }

  return {};
}

export async function getArticlesForCategory(category: string, offset: number = 0): Promise<Paper[]> {
  const prompt = `Use web search. Find 6 real, valid articles, papers, or posts across the web for the topic: "${category}". Provide a variety of results. Skip items you might have shown before (offset: ${offset}). For each item, provide title, authors (array of strings), one-sentence summary as 'summary', publishedDate, a unique 'arxivId' (unique short ID), and sourceLink. Respond with ONLY a valid JSON array of these items. Just return raw JSON string.`;

  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'longcat',
        prompt: prompt,
        config: {
          tools: [{googleSearch: {}}],
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server proxy failed with status ${response.status}`);
    }

    const data = await response.json();
    let text = data.text.trim();
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3);
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3);
    }
    
    if (text) {
      return JSON.parse(text.trim()) as Paper[];
    }
  } catch (error) {
    console.error('Error getting specific category articles from LongCat:', error);
  }

  return [];
}

/**
 * Streams a chat response for a follow-up question.
 * @param topic The original topic for context.
 * @param newMessage The new message from the user.
 * @param history The previous chat messages for context (if memory is enabled).
 * @param agentInstruction The system instruction for the AI agent.
 * @param context An optional string providing extra context for the question.
 * @returns An async generator that yields text chunks.
 */
export async function* streamChatResponse(
  topic: string,
  newMessage: string,
  history: ChatMessage[],
  agentInstruction: string,
  context?: string,
  taskCallbacks?: {
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    getTasks: () => Task[];
  },
  modelName?: string,
  isDeepSearch?: boolean
): AsyncGenerator<StreamChunk, void, undefined> {
  const systemInstruction = (agentInstruction || `You are a helpful expert assistant.`) + 
    ` You have web search and task management tools.`;

  const chatHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));
  
  const tools: any[] = [{ googleSearch: {} }];
  if (taskCallbacks) {
    tools.push({
      functionDeclarations: [
        { name: 'addTask', description: 'Add task', parameters: { type: 'OBJECT', properties: { title: { type: 'STRING' }, priority: { type: 'STRING' } }, required: ['title', 'priority'] } },
        { name: 'updateTask', description: 'Update task', parameters: { type: 'OBJECT', properties: { id: { type: 'STRING' }, updates: { type: 'OBJECT' } }, required: ['id', 'updates'] } },
        { name: 'deleteTask', description: 'Delete task', parameters: { type: 'OBJECT', properties: { id: { type: 'STRING' } }, required: ['id'] } },
        { name: 'getTasks', description: 'Get tasks', parameters: { type: 'OBJECT', properties: {} } },
      ]
    });
  }

  let searchContext = '';
  if (isDeepSearch) {
    yield { textChunk: '*Searching the web...*\n\n' };
    try {
      const searchResults = await searchExternal(newMessage);
      if (searchResults && searchResults.length > 0) {
        searchContext = "Web Search Results:\n" + searchResults.slice(0, 5).map((r, i) => `[${i+1}] ${r.title}\n(${r.url})\n${r.content}`).join('\n\n') + "\n\n";
      }
    } catch (e) {
       console.warn("Failed to fetch SearXNG results for chat:", e);
    }
  }

  try {
    const finalMessage = `${searchContext}${context ? `${context}\n\n` : ''}Client question: ${newMessage}`;
    const stream = streamFromServer('/api/gemini/stream', {
      model: modelName || textModelName,
      prompt: finalMessage,
      history: chatHistory,
      systemInstruction: systemInstruction,
      config: { tools }
    });
    
    for await (const chunk of stream) {
      if (chunk.functionCalls) {
        for (const call of chunk.functionCalls) {
          if (taskCallbacks) {
            if (call.name === 'addTask') taskCallbacks.addTask(call.args as any);
            else if (call.name === 'updateTask') taskCallbacks.updateTask(call.args.id, call.args.updates);
            else if (call.name === 'deleteTask') taskCallbacks.deleteTask(call.args.id);
            // Function responses back to model would require more logic, but this covers basic side effects
          }
        }
      }
      if (chunk.text) yield { textChunk: chunk.text };
    }
  } catch (error) {
    yield { textChunk: `Error: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}

export async function* streamDebate(
  topic: string,
  agent1: AgentProfile,
  agent2: AgentProfile,
): AsyncGenerator<StreamChunk, void, undefined> {
  const prompt = `Simulate a debate on "${topic}" between ${agent1.name} and ${agent2.name}. Format turns as ###SPEAKER: Name.`;
  try {
    const stream = streamFromServer('/api/gemini/stream', {
      model: textModelName,
      prompt: prompt,
    });
    for await (const chunk of stream) {
      if (chunk.text) yield { textChunk: chunk.text };
    }
  } catch (error) {
    yield { textChunk: `Error generating debate.` };
  }
}

export async function getLearningSyllabus(topic: string): Promise<SyllabusItem[]> {
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        prompt: `Create a 5-7 chapter learning syllabus for "${topic}". JSON array with title and description.`,
      })
    });
    const data = await response.json();
    return JSON.parse(data.text.trim()) as SyllabusItem[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function findPdfLink(topic: string): Promise<string | null> {
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: textModelName,
        prompt: `Direct PDF link for "${topic}". Just the URL or "null".`,
        config: { tools: [{ googleSearch: {} }] }
      })
    });
    const data = await response.json();
    const text = data.text?.trim();
    return text?.startsWith('http') ? text : null;
  } catch (error) {
    return null;
  }
}

export async function* streamLearningPageContent(topic: string, chapterTitle: string): AsyncGenerator<string, void, undefined> {
  try {
    const stream = streamFromServer('/api/gemini/stream', {
      model: textModelName,
      prompt: `Write content for chapter "${chapterTitle}" of topic "${topic}". Encyclopedic style.`,
    });
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error) {
    yield `Error loading content.`;
  }
}

export async function* streamJournalChatResponse(topic: string, notebookContent: string, history: ChatMessage[], userMessage: string): AsyncGenerator<string, void, undefined> {
  const systemInstruction = `Helpful tutor. Topic: ${topic}. Notes: ${notebookContent}`;
  const chatHistory = history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }));
  try {
    const stream = streamFromServer('/api/gemini/stream', {
      model: textModelName,
      prompt: userMessage,
      history: chatHistory,
      systemInstruction: systemInstruction
    });
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error) {
    yield `Error: ${error}`;
  }
}

export async function* streamTextTransformation(originalText: string, context: string, action: 'explain' | 'perspective' | 'metaphysical', topic: string): AsyncGenerator<string, void, undefined> {
  const prompt = `Rewrite "${originalText}" given context of "${topic}". Action: ${action}.`;
  try {
    const stream = streamFromServer('/api/gemini/stream', {
      model: textModelName,
      prompt: prompt,
    });
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error) {
    yield `Error transforming text.`;
  }
}