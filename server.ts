import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import * as cheerio from 'cheerio';

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

  const instances = [
      'https://searx.work/search',
      'https://searx.xyz/search',
      'https://dusk.id/search',
      'https://search.disroot.org/search',
      'https://searx.info/search',
      'https://searx.perennialte.ch/search',
      'https://searx.name/search',
      'https://searx.tiekoetter.com/search',
      'https://searxng.online/search',
      'https://paulgo.io/search',
      'https://search.mdosch.de/search',
      'https://pb.todon.fr/search'
  ];

  // SearXNG Search Proxy Route
  app.get('/api/search', async (req, res) => {
    const { q, type } = req.query as { q: string, type?: string };
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    let lastError = null;
    const category = type || 'general';

    // Shuffle instances to balance load and avoid getting 429 consistently on the first one
    const shuffledInstances = [...instances].sort(() => Math.random() - 0.5);

    for (const searxUrl of shuffledInstances) {
        try {
            // Add a timeout to headers and random user agent variation if possible
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
            ];
            const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

            // First try JSON, though images/videos json might be restricted on some instances
            try {
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
                    timeout: 5000 // Shorter timeout to fail fast and move to next instance
                });
                
                if (response.data && response.data.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
                    const results = response.data.results.map((r: any) => ({
                        title: r.title,
                        url: r.url,
                        content: r.content || r.snippet || '',
                        img_src: r.img_src || r.thumbnail || r.thumbnail_src,
                        thumbnail_src: r.thumbnail || r.thumbnail_src || r.img_src,
                        iframe_src: r.iframe_src
                    }));
                    return res.json(results);
                }
            } catch (jsonErr: any) {
                 console.warn(`SearXNG JSON Error on ${searxUrl}:`, jsonErr.message);
            }

            // Fallback to HTML scraping
             const htmlResponse = await axios.get(searxUrl, {
                headers: {
                    'User-Agent': randomUA,
                    'AcceptLanguage': 'en-US'
                },
                params: { q: q as string, categories: category, safesearch: 0 },
                timeout: 5000
            });
            const html = htmlResponse.data;
            const $ = cheerio.load(html);
            const results: any[] = [];
            
            if (category === 'images') {
                $('.result-images, .image-result, .result-image').each((i, elem) => {
                    if (i >= 24) return false;
                    const imgUrl = $(elem).find('img').attr('src') || $(elem).find('img').attr('data-src');
                    const sourceUrl = $(elem).find('a').attr('href');
                    const title = $(elem).find('.title').text().trim() || $(elem).find('img').attr('alt') || '';
                    if (imgUrl && sourceUrl) {
                        results.push({ url: sourceUrl, img_src: imgUrl, title });
                    }
                });
            } else if (category === 'videos') {
                 $('.result-video, .result').each((i, elem) => {
                    if (i >= 15) return false;
                    const titleEl = $(elem).find('h3 a, h4 a').first();
                    const sourceUrl = titleEl.attr('href') || '';
                    const title = titleEl.text().trim();
                    const thumb = $(elem).find('.thumbnail, img').attr('src');
                    let content = $(elem).find('.content').text().trim();
                    const duration = $(elem).find('.thumbnail_length, .duration').text().trim();
                    if (duration) content = `${duration} - ${content}`;
                    const iframeSrc = $(elem).find('iframe').attr('data-src') || $(elem).find('iframe').attr('src');
                    
                    if (title && sourceUrl) {
                        results.push({ title, url: sourceUrl, content, thumbnail_src: thumb, iframe_src: iframeSrc });
                    }
                });
            } else {
                $('.result').each((i, elem) => {
                    if (i >= 10) return false;
                    const titleEl = $(elem).find('h3 a, h4 a').first();
                    const contentEl = $(elem).find('.content').first();
                    const url = titleEl.attr('href') || '';
                    const title = titleEl.text().trim();
                    const content = contentEl.text().trim();
                    if (title && url) {
                        results.push({ title, url, content });
                    }
                });
            }
            
            if (results.length > 0) {
                return res.json(results);
            }
            
        } catch (error: any) {
            console.warn(`SearXNG Proxy Error on ${searxUrl}:`, error.message);
            lastError = error;
        }
    }
    
    res.status(500).json({ error: 'All search instances failed', details: lastError?.message });
  });

  const LONGCAT_API_KEY = 'ak_19P0aL4Ny9AD7Mo3vU9vg6JP9hQ1W';
  const LONGCAT_BASE_URL = 'https://api.longcat.chat/openai/v1/chat/completions';
  const LONGCAT_MODEL = 'LongCat-Flash-Omni-2603';

  function mapToOpenAIOmni(prompt: string, history: any[], systemInstruction?: string) {
      const messages: any[] = [];
      if (systemInstruction) {
          messages.push({ role: 'system', content: [{ type: 'text', text: systemInstruction }] });
      }
      if (history) {
          for (const msg of history) {
              const role = msg.role === 'model' ? 'assistant' : msg.role;
              const textStr = Array.isArray(msg.parts) ? msg.parts.map((p: any) => p.text).join('\n') : (msg.content || msg.text || '');
              messages.push({ role, content: [{ type: 'text', text: textStr }] });
          }
      }
      if (prompt) {
          messages.push({ role: 'user', content: [{ type: 'text', text: prompt }] });
      }
      return messages;
  }

  // Gemini Proxy Route
  app.post('/api/gemini/generate', async (req, res) => {
    const { model, prompt, config, history } = req.body;
    
    if (model && (model === 'longcat' || model.startsWith('LongCat'))) {
      const targetModel = model === 'longcat' ? LONGCAT_MODEL : model;
      try {
        const messages = mapToOpenAIOmni(prompt, history, config?.systemInstruction);
        const response = await axios.post(LONGCAT_BASE_URL, {
            model: targetModel,
            messages,
            stream: false
        }, {
            headers: { 'Authorization': `Bearer ${LONGCAT_API_KEY}` }
        });
        const textResponse = response.data.choices[0].message.content;
        return res.json({ text: typeof textResponse === 'string' ? textResponse : textResponse?.[0]?.text || '' });
      } catch (lcErr: any) {
        console.error('LongCat Generate Error:', lcErr.response?.data || lcErr.message);
        // Fallback to Gemini if LongCat fails
      }
    }

    const requestedModel = model || 'gemini-3-flash-preview';
    
    const tryGenerate = async (modelName: string) => {
      const contents: any[] = [];
      if (history) {
        history.forEach((m: any) => {
          contents.push({
            role: m.role === 'model' ? 'model' : 'user',
            parts: m.parts || [{ text: m.text || m.content }]
          });
        });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: config?.systemInstruction,
          ...config
        }
      });

      return response.text;
    };

    try {
      try {
        const text = await tryGenerate(requestedModel);
        res.json({ text });
      } catch (err: any) {
        if (err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429 || err.message?.includes('quota')) {
          console.warn(`Model ${requestedModel} exhausted, falling back to gemini-3.1-flash-lite`);
          const text = await tryGenerate('gemini-3.1-flash-lite');
          res.json({ text });
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Gemini Generate Error:', error.message);
      res.status(500).json({ error: error.message || 'Gemini API failed' });
    }
  });

  app.post('/api/gemini/stream', async (req, res) => {
    const { model, prompt, config, systemInstruction, history } = req.body;

    if (model && (model === 'longcat' || model.startsWith('LongCat'))) {
      const targetModel = model === 'longcat' ? LONGCAT_MODEL : model;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      try {
          const messages = mapToOpenAIOmni(prompt, history, systemInstruction || config?.systemInstruction);
          const response = await axios.post(LONGCAT_BASE_URL, {
              model: targetModel,
              messages,
              stream: true
          }, {
              headers: { 'Authorization': `Bearer ${LONGCAT_API_KEY}` },
              responseType: 'stream'
          });

          response.data.on('data', (chunk: Buffer) => {
              const lines = chunk.toString().split('\n');
              for (const line of lines) {
                  if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                      try {
                          const parsed = JSON.parse(line.slice(6));
                          if (parsed.choices && parsed.choices.length > 0) {
                              const delta = parsed.choices[0].delta;
                              if (delta && delta.content) {
                                  res.write(`data: ${JSON.stringify({ text: delta.content })}\n\n`);
                              } else if (delta && delta.type === 'response.text.delta' && delta.content) {
                                  // Fallback for omni API
                                  res.write(`data: ${JSON.stringify({ text: delta.content })}\n\n`);
                              }
                          }
                      } catch (e) {}
                  } else if (line.includes('[DONE]')) {
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
          return;
      } catch (error: any) {
          let errorMsg = error.message;
          if (error.response && error.response.data && typeof error.response.data.on === 'function') {
             // It's a stream error, we shouldn't return the raw IncomingMessage
             errorMsg = 'LongCat API streaming error: ' + error.response.status;
          }
          console.error('LongCat Stream Error:', errorMsg);
          res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
          return res.end();
      }
    }

    const requestedModel = model || 'gemini-3-flash-preview';
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const tryStream = async (modelName: string) => {
      const contents: any[] = [];
      if (history) {
        history.forEach((m: any) => {
          contents.push({
            role: m.role === 'model' ? 'model' : 'user',
            parts: m.parts || [{ text: m.text || m.content }]
          });
        });
      }
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction || config?.systemInstruction,
          ...config
        }
      });
      
      for await (const chunk of response) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    };

    try {
      try {
        await tryStream(requestedModel);
      } catch (err: any) {
        if (err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429 || err.message?.includes('quota')) {
          console.warn(`Model ${requestedModel} exhausted, falling back to gemini-3.1-flash-lite`);
          await tryStream('gemini-3.1-flash-lite');
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Gemini Stream Error:', error.message);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
