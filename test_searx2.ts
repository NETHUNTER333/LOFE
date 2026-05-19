import axios from 'axios';
import * as cheerio from 'cheerio';

const instances = [
    'https://paulgo.io/search',
    'https://search.bus-hit.me/search',
    'https://search.mowglii.aw/search',
    'https://searx.zhenye.me/search',
    'https://search.serwer.pw/search',
    'https://searx.kuku.lu/search',
    'https://searx.si/search',
    'https://searxng.zackptg5.com/search'
];

const test = async () => {
    for (const url of instances) {
        try {
            const res = await axios.get(url, {
                params: { q: 'black hole' },
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
                    'Accept-Language': 'en-US,en;q=0.5',
                }
            });
            const $ = cheerio.load(res.data);
            const titles = $('.result h3 a, .result h4 a, .result[data-url] a').map((i, el) => $(el).text()).get();
            if (titles.length > 0) {
                console.log(`Success with: ${url} - Found ${titles.length} results`);
            } else {
                console.log(`Failed with: ${url} - No results HTML parsed`);
            }
        } catch (e: any) {
            console.log(`Error with: ${url} - ${e.message}`);
        }
    }
}
test();
