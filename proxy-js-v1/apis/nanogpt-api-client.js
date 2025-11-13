import axios from 'axios';

const API_BASE = 'https://nano-gpt.com/api/v1';

export class NanoGptApiClient {
    constructor(apiKey = null) {
        this.client = axios.create({
            baseURL: API_BASE,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        });
    }

    async getModels() {
        return this.safe(() => this.client.get('/models'));
    }

    async proxyRequest(req) {
        return this.safe(() =>
            this.client.request({
                url: req.path.replace(/^\/v1/, ''),
                method: req.method,
                data: req.method !== 'GET' ? req.body : undefined,
                responseType: 'stream',
            })
        );
    }

    async safe(fn) {
        try {
            const response = await fn();
            return { success: true, data: response.data, headers: response.headers };
        } catch (err) {
            const error = err.response?.data || err.toString();
            const status = err.response?.status || 500;
            return { success: false, error, status };
        }
    }
}
