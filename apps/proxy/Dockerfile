FROM node:22-alpine

WORKDIR /app

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
