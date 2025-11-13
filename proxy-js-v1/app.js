import express from 'express';
import helmet from 'helmet';
import registerProxyRoutes from './routes/proxy.js';
import registerAdminRoutes from './routes/admin.js';

const PORT = 3000;
const app = express();

app.use(helmet());
app.use(express.json({ limit: '5mb' }));

console.log(`ℹ️ NanoGPT-Proxy (JS - MVP edition) - Version 1.0.0`);
console.log(`©️ Copyright © 2025 symphonic-navigator, and other contributors. All rights reserved.`);
console.log(`⚖️ MIT Licensed under the MIT License, Version 2.0\n`);

registerAdminRoutes(app);
registerProxyRoutes(app);

app.listen(PORT, () => console.log(`✅ Proxy ready at http://localhost:${PORT}`));
