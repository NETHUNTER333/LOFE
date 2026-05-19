import axios from 'axios';

const instances = [
    'https://searx.si/search',
    'https://searx.work/search',
];

const test = async () => {
    for (const url of instances) {
        try {
            const res = await axios.get(url, {
                params: { q: 'black hole', format: 'json', categories: 'images' },
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
                }
            });
            console.log(`Images Success: ${url}`, res.data.results?.slice(0, 2));
        } catch (e: any) {
            console.log(`Images Error ${url}: ${e.message}`);
        }
    }
}
test();
