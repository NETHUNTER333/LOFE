import axios from 'axios';
import * as cheerio from 'cheerio';

const testSearxImages = async (query: string) => {
    try {
        const url = 'https://searx.si/search';
        const res = await axios.get(url, {
            params: { q: query, categories: 'images' },
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'AcceptLanguage': 'en-US'
            }
        });
        const $ = cheerio.load(res.data);
        const images: any[] = [];
        $('.result-images').each((i, el) => {
             const imgUrl = $(el).find('img').attr('src');
             const sourceUrl = $(el).find('a').attr('href');
             const title = $(el).find('.title').text().trim() || $(el).find('img').attr('alt') || '';
             if (imgUrl && sourceUrl) {
                 images.push({ url: imgUrl, source: sourceUrl, title });
             }
        });
        console.log("SearX images:", images.slice(0, 3));
    } catch(e: any) {
        console.log("Error SearX images:", e.message);
    }
}
testSearxImages("black hole");
