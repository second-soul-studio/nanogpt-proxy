FROM node:22.21.1-alpine3.23

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps ./apps
COPY packages ./packages

RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter "@nanogpt-monorepo/core" build
RUN pnpm --filter proxy build

WORKDIR /app/apps/proxy

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "dist/main.js"]
