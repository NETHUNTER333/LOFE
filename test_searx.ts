import axios from 'axios';
import * as cheerio from 'cheerio';

const instances = [
    'https://searx.tiekoetter.com/search',
    'https://searx.be/search',
    'https://search.mdosch.de/search',
    'https://search.rhscz.eu/search',
    'https://search.sapti.me/search',
    'https://search.rabbit-company.com/search',
    'https://search.incogniweb.net/search',
    'https://searx.perennialte.ch/search',
    'https://searx.ru/search',
    'https://search.rowie.at/search',
    'https://searx.oakleycord.dev/search',
    'https://searx.namejeff.xyz/search',
    'https://searx.nixnet.services/search'
];

const test = async () => {
    for (const url of instances) {
        try {
            const res = await axios.get(url, {
                params: { q: 'black hole' },
                timeout: 5000
            });
            const $ = cheerio.load(res.data);
            const titles = $('.result h3 a, .result h4 a').map((i, el) => $(el).text()).get();
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
