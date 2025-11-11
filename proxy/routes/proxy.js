import { decrypt } from '../utilities/crypto.js';
import { db } from '../databases/sqlite-db.js';
import { NanoGptApiClient } from '../apis/nanogpt-api-client.js';
import express from 'express';

export default function registerProxyRoutes(app) {
    const router = express.Router();

    router.all('/*', async (req, res) => {
        const userEmail = req.headers['x-openwebui-user-email'];
        console.log(`ℹ️ [${req.method}] ${req.path} for ${userEmail || 'unknown user'}`);

        if (req.path === '/models') {
            console.log('✅ [PASS] /v1/models (no user check)');
            const apiClient = new NanoGptApiClient();
            const result = await apiClient.getModels();
            return result.success
                ? res.json(result.data)
                : res.status(result.status).json({ error: result.error });
        }

        if (!userEmail) {
            return res.status(400).json({ error: '⚠️ Missing user email header' });
        }

        let row;
        try {
            row = db.prepare('SELECT api_key FROM users WHERE email = ?').get(userEmail);
            if (!row) {
                return res.status(401).json({ error: '⚠️ User not found in DB' });
            }
        } catch(e) {
            console.error(e);
        }

        const apiKey = decrypt(row.api_key);
        const nanoGptApiClient = new NanoGptApiClient(apiKey);
        const result = await nanoGptApiClient.proxyRequest(req);

        if (!result.success) {
            return res.status(result.status).json({ error: result.error });
        }

        res.setHeader('Content-Type', result.headers['content-type'] || 'application/json');
        result.data.pipe(res);
    });

    app.use('/v1', router);
}
