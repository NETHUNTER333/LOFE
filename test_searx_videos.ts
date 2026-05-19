import axios from 'axios';
import * as cheerio from 'cheerio';

const testSearxVideos = async (query: string) => {
    try {
        const url = 'https://searx.si/search';
        const res = await axios.get(url, {
            params: { q: query, categories: 'videos' },
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'AcceptLanguage': 'en-US'
            }
        });
        const $ = cheerio.load(res.data);
        console.log("SearX videos HTML:", $('.result').first().html());
    } catch(e: any) {
        console.log("Error SearX videos:", e.message);
    }
}
testSearxVideos("black hole");
