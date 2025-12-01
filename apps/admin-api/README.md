# 🧠 NanoGPT admin-api

## 🌮 Setup

1. (If not done already) Generate DB_ENCRYPTION_KEY

```bash
openssl rand -hex 32
```

Note: This key must be identical in both **admin-api** and **proxy**

2. Generate HMAC secret for JWT_SECRET and JWT_REFRESH_SECRET

```bash
openssl rand -base64 64
```

2. For local development, create .env file with the following keys/values
```
ADMIN_EMAIL=<adminstrator email>
ADMIN_PASSWORD=<password>
DB_ENCRYPTION_KEY=<copy db encryption key here>
JWT_SECRET=<copy 1st hmac secret - base 64 here>
JWT_EXPIRES_IN=5m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<copy 2nd hmac secret - base 64 here>
JWT_BLACKLIST_TTL_SECONDS=86400
```

Remark: For production, password should be store in a Vault (like Hashicorp Vault OSS and injected while building the
docker image for security reason), and passed through the ADMIN_EMAIL and ADMIN_PASSWORD environment variable.
