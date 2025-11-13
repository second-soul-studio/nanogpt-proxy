import axios from 'axios';

const ROOT = new URL('https://nano-gpt.com/api/');

const API = Object.freeze({
    ROOT,
    REGULAR: new URL('v1/', ROOT),
    SUBSCRIPTION: new URL('subscription/v1/', ROOT),
});

const TIMEOUT = Object.freeze({
    WITHOUT_APIKEY: 60000,
    WITH_APIKEY: 180000,
})

export class NanoGptApiClient {
    constructor(apiKey = null) {
        this.client = axios.create({
            baseURL: API.REGULAR.href,
            timeout: apiKey == null ? TIMEOUT.WITHOUT_APIKEY : TIMEOUT.WITH_APIKEY,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        });
    }

    async getModels() {
        return this.safe(() => this.client.get(`${API.SUBSCRIPTION.href}/models`));
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
