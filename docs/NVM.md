# 🧰 Installing Node.js 20.19.0 with NVM

We strongly recommend using NVM (Node Version Manager) to manage Node.js versions across different environments.

## On Linux / macOS:

Install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Reload your shell configuration:

```bash
source ~/.nvm/nvm.sh
```

Verify NVM installation:

```bash
nvm --version
```

List available Node.js versions:

```bash
nvm list-remote
```

Install Node.js 20.19.0 (latest LTS version in the 22.x line):

```bash
nvm install 20.19.0
```

Use Node.js 20.x in the project:

```bash
nvm use 20
```

## On Windows (nvm-windows):

1. Download and install nvm-windows from https://github.com/coreybutler/nvm-windows/releases.
2. After installation, open a new Command Prompt or PowerShell.

Verify NVM installation:

```bash
nvm version
```

List available Node.js versions:

```bash
nvm list available
```

Install Node.js 20.x:

```bash
nvm install 20.19.0
```

Use Node.js 20.x globally:

```bash
nvm use 20.19.0
```

🔄 Verify Node.js version:

```bash
node -v
```

Should output: v20.19.x