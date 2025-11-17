# 🧠 NanoGPT Multi-User Proxy for OpenWebUI

A lightweight, Docker-ready **mono-repo** that exposes a proxy in front of a shared [OpenWebUI](https://github.com/open-webui/open-webui) instance, allowing **multiple users** to connect with **their own NanoGPT API key**.

The proxy:

- accepts **OpenAI-compatible** requests (chat, completions, streaming, etc.),
- transparently injects the correct NanoGPT key per user,
- keeps keys isolated per account for **privacy and separation of concerns**.

Ideal if you want to host a single OpenWebUI for a small team, but keep each person’s NanoGPT usage independent.

## ⚙️ Tech Stack

### Environment

- **Node.js** 20.x
- **TypeScript** 5.9.3
- **pnpm** (workspace + monorepo)

### Backend

- **NestJS** (REST APIs, auth, user & key management)
- **SQLite** (lightweight data store for users + API keys)

### Frontend

- **React 19** (via Vite)
- TypeScript
- Ready to integrate with the admin API & proxy endpoints

# 🧠 NanoGPT Multi-User Proxy for OpenWebUI

A lightweight, Docker-ready **mono-repo** that exposes a proxy in front of a shared [OpenWebUI](https://github.com/open-webui/open-webui) instance, allowing **multiple users** to connect with **their own NanoGPT API key**.

The proxy:

- accepts **OpenAI-compatible** requests (chat, completions, streaming, etc.),
- transparently injects the correct NanoGPT key per user,
- keeps keys isolated per account for **privacy and separation of concerns**.

Ideal if you want to host a single OpenWebUI for a small team, but keep each person’s NanoGPT usage independent.

---

## ⚙️ Tech Stack

### Environment

- **Node.js** 20.x
- **TypeScript** 5.9.3
- **pnpm** (workspace + monorepo)

### Backend

- **NestJS** (REST APIs, auth, user & key management)
- **SQLite** (lightweight data store for users + API keys)

### Frontend

- **React 19** (via Vite)
- TypeScript
- Ready to integrate with the admin API & proxy endpoints

---

## 📦 Monorepo Layout

This project is managed as a **pnpm workspace + Turborepo**.

```text
nanogpt-monorepo/
├── apps/
├──── admin-api/     # Admin API for user & NanoGPT key management
├──── frontend/      # React UI (admin & proxy frontend)
├──── proxy/         # NanoGPT proxy API for OpenWebUI
├── packages/
├──── core/          # Shared DTOs, types, utilities
├── docs/
├──── NVM.md         # Dev environment notes (Node/NVM)
├── turbo.json       # Turborepo tasks (dev/build/lint/format/test)
├── pnpm-workspace.yaml
└── package.json
```

# 🧰 Modules

* [apps/admin-api](apps/admin-api)
  * NestJS backend for:
    * user management,
    * association of users ↔ NanoGPT API keys,
    * admin-facing operations.

* [apps/proxy](apps/proxy)
  * NestJS proxy that:
    * exposes OpenAI-compatible endpoints, 
    * forwards traffic to OpenWebUI / NanoGPT, 
    * injects the right API key per user, 
    * supports streaming.

* [apps/frontend](apps/frontend)
  * React 19 (Vite) frontend:
    * UI to manage users and API keys, 
    * UI for configuring / testing the proxy.

* [packages/core](packages/core)
  * Shared library:
    * DTOs, types, helpers, 
    * can be reused across admin-api, proxy and frontend.

# ✅ Prerequisites

Before you start:

* Git
* Node.js 20.19.0 (recommended)
* Suggested: use nvm (Node Version Manager) - See: [docs/NVM.md](docs/NVM.md)
* pnpm (package manager)

Using IntelliJ IDEA?

* See [docs/INTELLIJ-IDEA.md](docs/INTELLIJ-IDEA.md)

# 🌮 Setup

1. Clone the repository
```bash
   git clone https://github.com/symphonic-navigator/nanogpt-proxy.git
   cd nanogpt-proxy
```

2. Install Node.js (via nvm – recommended)

If not installed already, follow the guide in [docs/NVM.md](docs/NVM.md), 
and make sure you’re on Node 20.x:

```bash
node -v
# v20.x.x
```

3. Install pnpm
```bash
   npm run install:pnpm
```

For a shorter alias (e.g. pnpm instead of pnpm.cmd on Windows),
see the official docs: https://pnpm.io/installation#using-a-shorter-alias

4. Install all workspace dependencies

From the repo root:

```bash
pnpm run bootstrap
```

This will:
* install dependencies for all apps/packages,
* wire the workspace with pnpm,
* prepare Turborepo tasks.

# 🧩 Running the Apps

1. Start the full dev stack

From the repo root:

```bash
pnpm dev
# alias for: turbo dev
```

This will, via Turborepo:

* start admin-api (NestJS, watch mode),
* start proxy (NestJS, watch mode),
* start core in watch mode (tsc -w),
* start frontend (Vite dev server).

Perfect for working on the whole system at once.

2. Run a single app

You can also start only one part of the monorepo using --filter.

Admin API
```bash
pnpm run dev --filter "@nanogpt-monorepo/admin-api"
```

Proxy API
```bash
pnpm run dev --filter "@nanogpt-monorepo/proxy"
```

Frontend
```bash
pnpm run dev --filter "@nanogpt-monorepo/frontend"
```

# 🧪 Useful Scripts (root)

At the monorepo root:

```bash
# Run all dev servers (admin-api, proxy, core, frontend)
pnpm dev
```

```bash
# Build all apps/packages
pnpm build
```

```bash
# Lint all projects (via Turborepo)
pnpm lint
```

```bash
# Auto-format all projects (where configured)
pnpm format
```

```bash
# Run tests for all projects (when tests are added)
pnpm test
```

Each app/package also exposes its own scripts (e.g. build, lint, format, test)
that you can run via pnpm --filter <name> <script>.

# 👩‍💻👨‍💻 Developers

| Name               | Role                |
|--------------------|---------------------|
| symphony-navigator | Developer           |
| diaphainein        | Developer           |          
| patrickbelanger    | Developer           |   
| lauriebeaulieu981  | patrickbelanger' AI | 

✨ Yes, the AI is listed — she did help design and debug this monorepo. 😉

# 📄 License

MIT – use it, break it, improve it. Contributions welcome!
