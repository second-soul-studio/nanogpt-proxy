# 🧠 NanoGPT Multi-User Proxy for OpenWebUI

A lightweight, Dockerized proxy that lets **multiple users** connect to a shared [OpenWebUI](https://github.com/open-webui/open-webui) 
instance — **each with their own NanoGPT API key**. It forwards all OpenAI-compatible requests while 
transparently injecting the correct key per user, with full streaming support and privacy.

# 🌮 Setup

1. Clone this repository 
```bash
sh
git clone https://github.com/symphonic-navigator/nanogpt-proxy.git
cd nanogpt-proxy
```

2. (Suggested) Install `nvm` (NodeJS Version Manager)
    - If not installed already, follow the [installation guide](docs/NVM.md)

3. Install `pnpm`
```bash
npm run "install:pnpm"
```
   - For aliases, read [installation/using-a-shorter-alias](https://pnpm.io/installation#using-a-shorter-alias)
4. 

# 🗺️ Project Structure

This project is a mono repo containing the following modules
* [core](packages/core)
* [admin-api](apps/admin-api)
* [proxy](apps/)

# 👩‍💻👨‍💻 Developers

| Name             | Role  |
|------------------|-------|
| Chris            | -     |
| Lauren           | -     |
| Patrick Bélanger | -     |

// To fill out

# 📄 License

MIT – use it, break it, improve it. Contributions welcome!
