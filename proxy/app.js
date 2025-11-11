import express from "express";
import helmet from "helmet";
import proxyRoutes from './routes/proxy.js';
import registerProxyRoutes from "./routes/proxy.js";

const PORT = 3000;
const app = express();

app.use(helmet());
app.use(express.json({ limit: '5mb' }));

// 🔐 Admin
// app.use('/api/v1/admin', adminRoutes);

// 🌐 NanoGPT Proxy
app.use('/v1', proxyRoutes);

console.log(`ℹ️ NanoGPT-Proxy - Version 1.0.0`);
console.log(`©️ Copyright © 2025 symphonic-navigator, and other contributors. All rights reserved.`);
console.log(`⚖️ MIT Licensed under the MIT License, Version 2.0\n`);

registerProxyRoutes(app);

app.listen(PORT, () => console.log(`✅  Proxy ready at http://localhost:${PORT}`));
