import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    const searxUrl = 'https://searx.site/search';
    try {
        const response = await axios.get(searxUrl, {
            params: {
               q: 'elon musk',
               categories: 'general',
               language: 'en-US'
            },
            timeout: 5000,
            headers: {
                'Accept': 'text/html'
            }
        });
        const $ = cheerio.load(response.data);
        const results: any[] = [];
        $('.result-default').each((i, el) => {
           const title = $(el).find('h4 a').text().trim();
           const url = $(el).find('h4 a').attr('href');
           const content = $(el).find('.content').text().trim();
           if (title && url) {
               results.push({ title, url, content });
           }
        });
        console.log("Found HTML results:", results.length);
        if (results.length === 0) {
            console.log("HTML Start:", response.data.substring(0, 500));
            // try to see if there are any results classes
            const classes = new Set();
            $('[class^="result"]').each((i, el) => {
               classes.add($(el).attr('class'));
            });
            console.log("Result classes found:", Array.from(classes));
        }
        if (results.length > 0) {
           console.log(results[0]);
        }
    } catch(e: any) {
        console.log("Failed:", e.message, e.response?.status);
    }
}
test();
