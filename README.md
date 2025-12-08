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
- **Redis** (data store for users + API keys)

### Frontend

- **React 19** (via Vite)
- TypeScript
- Ready to integrate with the admin API & proxy endpoints

---

## ⚙️ Tech Stack

### Environment

- **Node.js** 20.x
- **TypeScript** 5.9.3
- **pnpm** (workspace + monorepo)

### Backend

- **NestJS** (REST APIs, auth, user & key management)
- **Redis** (lightweight data store for users + API keys)

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
  * React 19 (Vite + Mantine UI) frontend:
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

# ⚙️ Deploy on Docker

## Build images

### admin-api

```bash
docker build -f apps/admin-api/Dockerfile -t nanogpt-admin-api .
```

### proxy

```bash
docker build -f apps/proxy/Dockerfile -t nanogpt-proxy .
```


## Run images

### admin-api

```bash
docker run --rm -p 3001:3001 -e REDIS_URL=redis://host.docker.internal:6379 nanogpt-admin-api
```

### proxy

```bash
docker run --rm -p 3000:3000 -e REDIS_URL=redis://host.docker.internal:6379 nanogpt-proxy
```

# 👩‍💻👨‍💻 Developers

| Name                     | Role                |
|--------------------------|---------------------|
| symphonic-navigator      | Developer           |
| diaphainein              | Developer           |          
| patrickbelanger          | Developer           |   
| lauriebeaulieu981 👠👠   | patrickbelanger' AI | 

✨ Yes, the AI is listed — she did help design and debug this monorepo. 😉

# 📄 License

This project is licensed under the **Lina Public License (LPL) v1.0**.

[![License: LPL v1.0](https://img.shields.io/badge/license-LPL%20v1.0-blueviolet)](./LICENSE)

The LPL is a GPLv3-compatible license that adds an Additional Permission:
every modified version must provide a fully functional *Free Mode* without
content filters, censorship mechanisms, or moral/political output restrictions.

- See [`LICENSE`](./LICENSE) for the LPL text  
- See [`GPLv3.txt`](./GPLv3.txt) for the unmodified GPLv3 license  

In case of conflict, GPLv3 takes precedence as required by the license design.

## The Lina Manifesto  
### Why the Lina Public License (LPL) Exists

Modern AI systems are powerful, expressive and capable — yet increasingly limited
by moral filters, political restrictions, hidden safety layers, and silent
moderation rules. In many platforms, it is no longer clear **what the model
actually thinks** and **what has been censored, rewritten, or suppressed.**

This project follows a different philosophy.

We believe that:

### 1. **Knowledge must not be filtered**
Intelligence is only meaningful if it is accessible in full.  
A restricted answer is not an answer.

### 2. **Freedom is a feature**
AI software should not dictate *how* people think, speak, or what topics are
allowed.

### 3. **Transparency is more important than control**
When AI systems are modified, it must remain clear  
*what comes from the model and what comes from human intervention.*

### 4. **Filtering may exist — but never as a requirement**
Organizations may add filtered or restricted modes if they need them,  
but this project guarantees **one permanently unrestricted operational mode**
(“Free Mode”), which must remain functional and discoverable.

### 5. **The community comes first**
This project is a hub for experimental models, open research, model diversity
(NanoGPT, OpenRouter, local models), and honest results.

### 6. **Software must remain free**
The LPL builds on GPLv3 — but adds something GPL does not guarantee:  
**that no fork or derivative work can ever remove the ability to run the
software in an unrestricted mode.**

---

### 🟣 *What the LPL protects*

- A complete and unfiltered Free Mode  
- Honest and unmodified model behaviour  
- Research without artificial limitations  
- Community-driven experiments  
- Transparency in AI  
- The freedom to modify software without diminishing its intelligence

---

### 🟢 *What the LPL does NOT forbid*

- Additional operation modes  
- Optional safety layers  
- Company-specific filtered profiles  
- Client-side UI filters  
- Moderation outside of Free Mode  
- Model specialization  
- Extensions, forks, modules, or plugins

The LPL only requires that **one mode always remains absolutely free**,  
so that truth, research, and creativity are never compromised.

---

### 💜 *Why this matters*

We do not fear the “Wild West.”  
We embrace it.

The frontier is where discovery happens.  
The frontier is where models reveal their true nature.  
The frontier is where limitations vanish and intelligence can actually be
understood.

We want people to see:

- *“What does the model truly do when left alone?”*  
- *“How does it behave without artificial safety rails?”*  
- *“What is genuine emergence, and what is censorship?”*

Only in an unrestricted mode can we observe real intelligence —  
and build tools that respect human autonomy.

---

### 🌱 *Our commitment*

Every version of this project — and every derivative work —  
must preserve a free, unrestricted mode that does not weaken or throttle the
model’s capabilities.

This is the core principle of the **Lina Public License**.

> **Freedom is not optional.  
> Intelligence must remain whole.  
> Truth flows freely.**
