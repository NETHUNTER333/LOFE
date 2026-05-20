import { YoutubeTranscript } from 'youtube-transcript';
import google from 'googlethis';
import ytSearch from 'youtube-search-api';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // Transcript Proxy Route
  app.get('/api/transcript', async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'videoId is required' });
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId as string);
      res.json(transcript);
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to fetch transcript', details: e.message });
    }
  });

  // Autocomplete Proxy Route
  app.get('/api/search_suggestions', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
      const response = await axios.get(`https://duckduckgo.com/ac/?q=${encodeURIComponent(q as string)}`);
      res.json(response.data);
    } catch {
      res.json([]);
    }
  });

  // Blacklist for temporarily failing search instances
  const instanceBlacklist = new Map<string, number>();
  const BLACKLIST_DURATION = 1000 * 60 * 30; // 30 minutes

  const instances = [
      'https://searx.info/search',
      'https://searxng.online/search',
      'https://dusk.id/search',
      'https://search.disroot.org/search',
      'https://searx.site/search',
      'https://searx.online/search',
      'https://kantan.cat/search',
      'https://searxng.ch/search',
      'https://searx.divided-by-zero.eu/search',
      'https://priv.au/search',
      'https://failsearx.culturanerd.it/search',
      'https://searx.work/search'
  ];

  // SearXNG Search Proxy Route
  app.get('/api/search', async (req, res) => {
    const { q, type } = req.query as { q: string, type?: string };
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY;
    const category = type || 'general';

    // Try Tinyfish first if API Key is present
    if (TINYFISH_API_KEY) {
      try {
        let tfCategory = 'web';
        if (category === 'images') tfCategory = 'media';
        else if (category === 'videos') tfCategory = 'media';
        else if (category === 'social') tfCategory = 'social';
        else if (category === 'general') tfCategory = 'web';

        // Try a few possible endpoints for Tinyfish to be robust
        const tfEndpoints = [
          'https://api.tinyfish.ai/search',
          'https://tinyfish.ai/api/search',
          'https://api.tinyfish.ai/v1/search',
          'https://api.tinyfish.app/v1/search',
          'https://api.tinyfish.app/search'
        ];

        let tfResponse = null;
        for (const endpoint of tfEndpoints) {
          try {
            tfResponse = await axios.post(endpoint, {
              query: q,
              search_type: tfCategory,
              num_results: category === 'general' ? 10 : 20
            }, {
              headers: {
                'Authorization': `Bearer ${TINYFISH_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 4000 // Fast fail for endpoint discovery
            });
            if (tfResponse.data) break;
          } catch (e) {
            continue;
          }
        }

        if (tfResponse && tfResponse.data && tfResponse.data.results && Array.isArray(tfResponse.data.results)) {
          const results = tfResponse.data.results.map((r: any) => ({
            title: r.title || r.name || r.text || 'Untitled',
            url: r.url || r.link || r.source_url || '',
            content: r.content || r.snippet || r.description || r.text || '',
            img_src: r.img_src || r.thumbnail || r.image_url || r.thumbnail_url || r.profile_image_url,
            thumbnail_src: r.thumbnail || r.thumbnail_url || r.image_url || r.img_src || r.profile_image_url,
            iframe_src: r.iframe_src || r.embed_url || r.video_url,
            engine: 'Hermes/Tinyfish'
          }));

          if (results.length > 0) {
            return res.json(results);
          }
        }
      } catch (tfErr: any) {
        console.error('Tinyfish Search Error:', tfErr.response?.data || tfErr.message);
        // Fallback to SearXNG
      }
    }

    // Try SearXNG fallback with fast timeout
    let lastError = null;
    const now = Date.now();
    const activeInstances = instances.filter(url => {
        const blacklistedAt = instanceBlacklist.get(url);
        return !(blacklistedAt && now - blacklistedAt < BLACKLIST_DURATION);
    });

    const shuffledInstances = [...(activeInstances.length > 0 ? activeInstances : instances)].sort(() => Math.random() - 0.5).slice(0, 2);

    for (const searxUrl of shuffledInstances) {
        try {
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ];
            const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

            const response = await axios.get(searxUrl, {
                headers: {
                    'User-Agent': randomUA,
                    'Accept': 'application/json'
                },
                params: {
                    q: q as string,
                    format: 'json',
                    categories: category,
                    safesearch: 0
                },
                timeout: 2500
            });
            
            if (response.data && response.data.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
                const results = response.data.results.map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content || r.snippet || '',
                    img_src: r.img_src || r.thumbnail || r.thumbnail_src,
                    thumbnail_src: r.thumbnail || r.thumbnail_src || r.img_src,
                    iframe_src: r.iframe_src,
                    engine: r.engine || 'SearX'
                }));
                return res.json(results);
            }
        } catch (error: any) {
            instanceBlacklist.set(searxUrl, Date.now());
            lastError = error;
        }
    }
    
    const fallbackHeaders = { 'User-Agent': 'HermesSearch/1.0 (https://ais.studio; user@example.com) axios/1.x' };
    
    if (category === 'images') {
        try {
            const googleImages = await google.image(q as string, { safe: false });
            if (googleImages && googleImages.length > 0) {
                const results = googleImages.slice(0, 20).map((r: any) => ({
                    title: r.origin?.title || r.title || 'Image',
                    url: r.origin?.website?.url || r.url,
                    img_src: r.url,
                    thumbnail_src: r.preview?.url || r.url,
                    engine: 'Google Images'
                }));
                return res.json(results);
            }
        } catch(e) {}
        
        try {
            const wikiSearch = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q as string)}&gsrlimit=20&prop=pageimages&piprop=original|thumbnail&pithumbsize=600&format=json`, { ...fallbackHeaders });
            if (wikiSearch.data?.query?.pages) {
                const results = Object.values(wikiSearch.data.query.pages)
                  .filter((p: any) => p.thumbnail || p.original)
                  .map((p: any) => {
                     const imgUrl = p.thumbnail?.source || p.original?.source;
                     return { title: p.title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title)}`, img_src: imgUrl, engine: "Wikipedia" };
                  });
                if (results.length > 0) return res.json(results);
            }
        } catch(e) {}
        return res.json([]);
    } else if (category === 'videos') {
       try {
           const ytResults = await ytSearch.GetListByKeyword(q as string, false, 15, [{type: 'video'}]);
           if (ytResults && ytResults.items && ytResults.items.length > 0) {
               const results = ytResults.items.filter((r: any) => r.type === 'video').map((r: any) => ({
                   title: r.title,
                   url: `https://www.youtube.com/watch?v=${r.id}`,
                   content: `Channel: ${r.channelTitle}`,
                   thumbnail_src: r.thumbnail.thumbnails?.[r.thumbnail.thumbnails.length - 1]?.url || r.thumbnail.thumbnails?.[0]?.url,
                   iframe_src: `https://www.youtube.com/embed/${r.id}`,
                   engine: 'YouTube'
               }));
               if (results.length > 0) return res.json(results);
           }
       } catch(e) {}
       return res.json([]);
    } else if (category === 'social') {
        try {
            const googleSearch = await google.search(`site:twitter.com OR site:instagram.com OR site:reddit.com OR site:linkedin.com OR site:youtube.com OR site:facebook.com OR site:tiktok.com ${q}`, { page: 0, safe: false, parse_ads: false });
            if (googleSearch && googleSearch.results && googleSearch.results.length > 0) {
               const results = googleSearch.results.map((r: any) => ({
                   title: r.title,
                   url: r.url,
                   content: r.description,
                   engine: 'Google (Social)'
               }));
               return res.json(results);
            }
        } catch(e) {}
        return res.json([]);
    } else {
        try {
            const googleSearch = await google.search(q as string, { page: 0, safe: false, parse_ads: false });
            if (googleSearch && googleSearch.results && googleSearch.results.length > 0) {
               const results = googleSearch.results.map((r: any) => ({
                   title: r.title,
                   url: r.url,
                   content: r.description,
                   engine: 'Google'
               }));
               return res.json(results);
            }
        } catch(e) {}
        try {
            const wikiSearch = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q as string)}&utf8=&format=json`, { ...fallbackHeaders });
            if (wikiSearch.data?.query?.search) {
                const results = wikiSearch.data.query.search.map((r: any) => ({
                    title: r.title,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
                    content: r.snippet.replace(/<[^>]*>?/gm, ''),
                    engine: 'Wikipedia'
                }));
                if (results.length > 0) return res.json(results);
            }
        } catch(e) {}
        return res.json([]);
    }
  });

  const LONGCAT_API_KEY = 'ak_19P0aL4Ny9AD7Mo3vU9vg6JP9hQ1W';
  const LONGCAT_BASE_URL = 'https://api.longcat.chat/openai/v1/chat/completions';
  const LONGCAT_MODEL = 'LongCat-Flash-Chat';

  // Helper for trending topics fetching in HTML/Cheerio style as requested
  app.get('/api/articles/trending', async (req, res) => {
    const categories = [
        "Theoretical Physics & Cosmology", 
        "Artificial Intelligence & Robotics", 
        "Computational Biology & Bioinformatics",
        "Psychology & Neuroscience",
        "Arts & Culture"
    ];
    
    const prompt = `You are a web search assistant. Search for 4 real, trending articles, papers, or posts for these specific categories: ${categories.join(', ')}.
    
    RESPOND ONLY WITH A COMPLETE HTML DOCUMENT. NO CONVERSATION. NO MARKDOWN BLOCKS.
    
    Desired HTML Structure:
    <!DOCTYPE html>
    <html>
    <head><title>Trending Topics</title></head>
    <body>
      <div class="category-section">
        <h2>[Category Name]</h2>
        <article>
          <h3 class="title">[Article Title]</h3>
          <p class="authors">[Author Names]</p>
          <p class="summary">[One-sentence summary]</p>
          <span class="date">[Date]</span>
          <span class="id">[Unique short hash]</span>
          <a class="link" href="[Valid URL]">Source</a>
        </article>
      </div>
    </body>
    </html>`;

    try {
      const messages = [
        { role: 'system', content: 'You are an scientific research assistant that provides data in raw HTML format.' },
        { role: 'user', content: prompt }
      ];
      
      console.log(`[Trending] Fetching from LongCat...`);
      const lcResponse = await axios.post(LONGCAT_BASE_URL, {
          model: 'LongCat-Flash-Chat', // Switching to Chat for better reliability
          messages,
          stream: false,
          max_tokens: 4000,
          temperature: 0.3
      }, {
          headers: { 'Authorization': `Bearer ${LONGCAT_API_KEY}` },
          timeout: 50000
      });

      let html = lcResponse.data.choices[0].message.content;
      
      // Clean up markdown markers if present
      if (html.includes('```html')) {
        html = html.split('```html')[1].split('```')[0].trim();
      } else if (html.includes('```')) {
        html = html.split('```')[1].split('```')[0].trim();
      }

      const $ = cheerio.load(html);
      const trending: any = {};

      $('.category-section').each((_, catElem) => {
          const categoryName = $(catElem).find('h2').text().trim();
          if (!categoryName) return;
          
          const papers: any[] = [];
          $(catElem).find('article').each((_, artElem) => {
              const authorsText = $(artElem).find('.authors').text().trim();
              papers.push({
                  title: $(artElem).find('.title').text().trim(),
                  authors: authorsText ? authorsText.split(/,|and/).map(a => a.trim()).filter(Boolean) : [],
                  summary: $(artElem).find('.summary').text().trim(),
                  publishedDate: $(artElem).find('.date').text().trim(),
                  arxivId: $(artElem).find('.id').text().trim(),
                  sourceLink: $(artElem).find('.link').attr('href') || ''
              });
          });
          if (papers.length > 0) {
            trending[categoryName] = papers;
          }
      });

      console.log(`[Trending] Successfully parsed ${Object.keys(trending).length} categories`);
      res.json(trending);
    } catch (err: any) {
      console.error('Trending HTML Fetch Error Detail:', err.message);
      try {
        res.status(500).json({ error: 'Failed to fetch trending articles', details: err.message });
      } catch (e) {
        res.status(500).send('Failed to fetch trending articles');
      }
    }
  });

  app.get('/api/articles/category', async (req, res) => {
    const { category, offset } = req.query;
    const prompt = `Search for 6 real, valid articles or papers for the topic: "${category}" (offset index: ${offset || 0}).
    
    RESPOND ONLY WITH RAW HTML.
    
    Structure:
    <!DOCTYPE html>
    <html>
    <body>
      <article>
        <h3 class="title">[Title]</h3>
        <p class="authors">[Authors]</p>
        <p class="summary">[Summary]</p>
        <span class="date">[Date]</span>
        <span class="id">[Unique ID]</span>
        <a class="link" href="[URL]">Source</a>
      </article>
    </body>
    </html>`;

    try {
      const messages = [
        { role: 'system', content: 'You are an scientific research assistant that provides data in raw HTML format.' },
        { role: 'user', content: prompt }
      ];
      
      const lcResponse = await axios.post(LONGCAT_BASE_URL, {
          model: 'LongCat-Flash-Chat',
          messages,
          stream: false,
          max_tokens: 3000
      }, {
          headers: { 'Authorization': `Bearer ${LONGCAT_API_KEY}` },
          timeout: 45000
      });

      let html = lcResponse.data.choices[0].message.content;
      if (html.includes('```html')) {
        html = html.split('```html')[1].split('```')[0].trim();
      }

      const $ = cheerio.load(html);
      const articles: any[] = [];

      $('article').each((_, artElem) => {
          const authorsText = $(artElem).find('.authors').text().trim();
          articles.push({
              title: $(artElem).find('.title').text().trim(),
              authors: authorsText ? authorsText.split(/,|and/).map(a => a.trim()).filter(Boolean) : [],
              summary: $(artElem).find('.summary').text().trim(),
              publishedDate: $(artElem).find('.date').text().trim(),
              arxivId: $(artElem).find('.id').text().trim(),
              sourceLink: $(artElem).find('.link').attr('href') || ''
          });
      });

      res.json(articles);
    } catch (err: any) {
      console.error('Category articles Fetch Error:', err.message);
      res.status(500).json({ error: 'Failed to fetch category articles' });
    }
  });

  function mapToOpenAI(prompt: string, history: any[], systemInstruction?: string) {
      const messages: any[] = [];
      if (systemInstruction) {
          messages.push({ role: 'system', content: systemInstruction });
      }
      if (history) {
          for (const msg of history) {
              const role = (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user';
              const textStr = Array.isArray(msg.parts) 
                  ? msg.parts.map((p: any) => p.text).join('\n') 
                  : (msg.content || msg.text || '');
              if (textStr) {
                  messages.push({ role, content: textStr });
              }
          }
      }
      if (prompt) {
          messages.push({ role: 'user', content: prompt });
      }
      return messages;
  }

  // Gemini Proxy Route
  app.post('/api/gemini/generate', async (req, res) => {
    const { model, prompt, config, history } = req.body;
    console.log(`[Generate] Received request for model: ${model}`);
    const start = Date.now();
    let lcError = null;
    
    // Default to LongCat for everything unless specifically overridden
    const targetModel = (model && model.startsWith('LongCat')) ? model : LONGCAT_MODEL;
    
    try {
      const messages = mapToOpenAI(prompt, history, config?.systemInstruction);
      const response = await axios.post(LONGCAT_BASE_URL, {
          model: targetModel,
          messages,
          stream: false,
          temperature: config?.temperature || 0.7,
          max_tokens: config?.maxOutputTokens || 2048
      }, {
          headers: { 'Authorization': `Bearer ${LONGCAT_API_KEY}` },
          timeout: 30000 
      });

      console.log(`[Generate] LongCat responded in ${Date.now() - start}ms`);

      if (response.data && response.data.choices && response.data.choices[0]) {
          const textResponse = response.data.choices[0].message.content;
          const text = typeof textResponse === 'string' ? textResponse : textResponse?.[0]?.text || '';
          if (text) {
              return res.json({ text });
          }
      }
      throw new Error('Invalid response format from LongCat');
    } catch (err: any) {
      if (err.response && typeof err.response.data === 'string' && err.response.data.includes('<!DOCTYPE')) {
        lcError = `HTML error from API (${err.response.status})`;
      } else {
        lcError = err.response?.data || err.message;
      }
      console.error(`[Generate] API Error after ${Date.now() - start}ms:`, lcError);
      return res.status(500).json({ error: lcError });
    }
  });

  app.post('/api/gemini/stream', async (req, res) => {
    const { model, prompt, config, systemInstruction, history } = req.body;

    const targetModel = (model && model.startsWith('LongCat')) ? model : LONGCAT_MODEL;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
        const messages = mapToOpenAI(prompt, history, systemInstruction || config?.systemInstruction);
        const response = await axios.post(LONGCAT_BASE_URL, {
            model: targetModel,
            messages,
            stream: true,
            temperature: config?.temperature || 0.7
        }, {
            headers: { 'Authorization': `Bearer ${LONGCAT_API_KEY}` },
            responseType: 'stream',
            timeout: 60000
        });

        response.data.on('data', (chunk: Buffer) => {
            const chunkStr = chunk.toString();
            const lines = chunkStr.split('\n');
            for (const line of lines) {
                const cleanLine = line.trim();
                if (cleanLine.startsWith('data: ') && !cleanLine.includes('[DONE]')) {
                    try {
                        const jsonStr = cleanLine.slice(6);
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.choices && parsed.choices.length > 0) {
                            const delta = parsed.choices[0].delta;
                            if (delta && delta.content) {
                                res.write(`data: ${JSON.stringify({ text: delta.content })}\n\n`);
                            }
                        }
                    } catch (e) {
                    }
                } else if (cleanLine.includes('[DONE]')) {
                    res.write('data: [DONE]\n\n');
                }
            }
        });
        
        response.data.on('end', () => {
            res.end();
        });
        response.data.on('error', (err: any) => {
            res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
            res.end();
        });
    } catch (error: any) {
        let errorMsg = error.message;
        console.error('LongCat Stream Error:', errorMsg);
        res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
        return res.end();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Server Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
