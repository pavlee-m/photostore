FROM oven/bun:latest AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# Production /api is Caddy. A baked Nitro proxy would freeze a container DNS name.
RUN bun run build

FROM oven/bun:latest AS development
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

ENV VITE_DEV_API_PROXY="http://host.docker.internal:8080"

CMD ["bun", "--bun", "run", "dev", "--", "--host", "0.0.0.0"]

FROM oven/bun:latest AS production
WORKDIR /app

COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0

CMD ["bun", "run", "start"]
