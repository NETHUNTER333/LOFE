import axios from 'axios';

const test = async () => {
    try {
        const res = await axios.get('https://searx.si/search', {
            params: { q: 'black hole', format: 'json' },
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
            }
        });
        console.log(`JSON Success: ${!!res.data.results}`);
    } catch (e: any) {
        console.log(`JSON Error: ${e.message}`);
    }
}
test();
