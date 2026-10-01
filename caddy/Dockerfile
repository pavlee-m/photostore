FROM oven/bun:latest AS frontend-build
WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ ./
RUN bun run build

FROM caddy:2-alpine AS production

COPY caddy/Caddyfile /etc/caddy/Caddyfile

COPY --from=frontend-build /app/dist/client /srv/www
RUN mv /srv/www/_shell.html /srv/www/index.html

EXPOSE 8003
