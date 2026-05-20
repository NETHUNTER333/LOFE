import axios from 'axios';

async function test() {
    const searxUrl = 'http://localhost:3000/api/search';
    try {
        const response = await axios.get(searxUrl, {
            params: {
               q: 'James Webb Telescope',
               type: 'videos'
            },
            timeout: 10000
        });
        console.log("Success! Results:", response.data.length);
        if (response.data.length > 0) {
            console.log(response.data[0]);
        }
    } catch(e: any) {
        console.log("Failed:", e.message, e.response?.status);
    }
}
test();
