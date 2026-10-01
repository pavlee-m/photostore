FROM oven/bun:latest AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:latest AS development
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "--bun", "run", "dev", "--", "--host", "0.0.0.0"]

# There is no production stage here anymore. In production the frontend is a
# static SPA bundle served by Caddy; see caddy/Dockerfile and compose.prod.yaml.
