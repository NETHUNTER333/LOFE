import axios from 'axios';
import * as cheerio from 'cheerio';

const test = async () => {
    try {
        const url = 'https://searx.si/search';
        const res = await axios.get(url, {
            params: { q: 'black hole' },
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
            }
        });
        const html = res.data;
        const matches = html.match(/class="[^"]*result[^"]*"/g);
        console.log(matches?.slice(0, 10));
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}
test();
