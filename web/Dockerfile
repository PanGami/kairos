# ---- Stage 1: build static assets ----
FROM node:22-alpine AS build
WORKDIR /app
COPY web/package.json ./
RUN npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

# ---- Stage 2: Caddy serves static assets (config mounted from deploy/caddy) ----
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
