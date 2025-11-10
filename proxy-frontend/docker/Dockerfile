# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY ../package.json package-lock.json ./

ENV NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
RUN npm ci

COPY .. .

RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]