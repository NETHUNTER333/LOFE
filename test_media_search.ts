import axios from 'axios';
import * as cheerio from 'cheerio';

const testBing = async (query: string) => {
    try {
        const res = await axios.get(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        const images: any[] = [];
        $('a.iusc').each((i, el) => {
            const m = $(el).attr('m');
            if (m) {
                try {
                    const data = JSON.parse(m);
                    images.push({
                        url: data.murl,
                        thumb: data.turl,
                        title: data.t
                    });
                } catch(e) {}
            }
        });
        console.log("Images found:", images.slice(0, 3));
    } catch(e: any) {
        console.log("Error BING:", e.message);
    }
}
testBing("black hole");
