# 🧠 NanoGPT Multi-User Proxy for OpenWebUI

A lightweight, Dockerized proxy that lets **multiple users** connect to a shared [OpenWebUI](https://github.com/open-webui/open-webui) instance — **each with their own NanoGPT API key**. It forwards all OpenAI-compatible requests while transparently injecting the correct key per user, with full streaming support and privacy.

> 🔐 Keys are stored **encrypted** in SQLite using AES-256, and user-identifying headers are stripped before forwarding to NanoGPT.

---

## 🚀 Features

- ✅ **Per-user API keys** (no shared quota)
- ✅ **OpenAI-compatible endpoint** (`/v1/...`)
- ✅ Supports **chat completions, embeddings, images, streaming**
- ✅ **Zero user info leaked** to NanoGPT
- ✅ Fast setup via Docker (~15 minutes)
- ✅ CLI for adding/removing users
- ✅ Tiny footprint (Node.js + SQLite + Docker)

---

## 🧱 Architecture

OpenWebUI (shared UI) --> Proxy (injects key, strips headers) --> NanoGPT API
| |
| |
User Key Email Encrypted SQLite DB


OpenWebUI forwards user email via `X-OpenWebUI-User-Email`, and the proxy maps that to a stored, encrypted API key.

---

## 📦 Quick Start

### 1. Clone this repo

```
sh
git clone https://github.com/<your-user>/nanogpt-proxy
cd nanogpt-proxy
```
2. Set encryption password

Edit proxy/.env:

DB_ENCRYPTION_KEY=CHANGE_THIS_TO_A_RANDOM_32_BYTE_VALUE

    Tip: generate one with openssl rand -hex 32.

3. Launch stack

docker compose up -d --build

4. Add a user + API key

```
docker compose exec proxy node init-db.js add-user alice@example.com sk-abc123...
```

List all users:

```
docker compose exec proxy node init-db.js list
```

Delete a user:

```
docker compose exec proxy node init-db.js del-user alice@example.com
```

🔌 OpenWebUI Setup

In your OpenWebUI settings under Connections, add:

Name: NanoGPT Proxy
Base URL: http://<your-server-ip>:3000/v1
Model: (leave blank or use 'gpt-4')

Make sure this is set in your OpenWebUI .env:

ENABLE_FORWARD_USER_INFO_HEADERS=true

👨‍💻 Development
Rebuild after code changes:

```
docker compose up -d --build
```

View proxy logs:

```
docker compose logs -f proxy
```

🔐 Security Notes

    API keys are stored encrypted in keys.db using AES-256-CTR.

    The proxy strips X-OpenWebUI-* headers before making upstream calls.

    Runs as non-root inside container.

    You should terminate TLS externally (Caddy, Traefik, Nginx, etc.)

🎯 Roadmap

Optional JWT-based auth to block unknown users

Web-based admin UI for managing users

Docker health checks

    Built-in rate limiting per user

📄 License

MIT – use it, break it, improve it. Contributions welcome!
