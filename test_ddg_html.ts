import axios from 'axios';

const test = async () => {
    try {
        const res = await axios.get('https://html.duckduckgo.com/html/?q=black+hole', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });
        console.log(res.data.substring(1000, 2000));
    } catch (e: any) {
        console.log(e.message);
    }
}
test();
