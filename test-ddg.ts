import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    try {
        const response = await axios.post('https://html.duckduckgo.com/html/', `q=elon+musk`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const results: any[] = [];
        $('.result').each((i, elem) => {
            const title = $(elem).find('.result__title a').text().trim();
            const url = $(elem).find('.result__url').attr('href');
            const content = $(elem).find('.result__snippet').text().trim();
            if (title && url) {
                results.push({ title, url });
            }
        });
        console.log("DDG results:", results.length);
        if (results.length === 0) {
            console.log("DDG HTML:", response.data);
        }
    } catch (e: any) {
        console.log("DDG failed:", e.message);
    }
}
test();
