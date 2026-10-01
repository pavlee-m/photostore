# Photostore

Photostore is a self-hosted photo and video library for storing, browsing, and organizing personal media. It provides a responsive web interface backed by a Spring Boot API and Microsoft SQL Server.

## Features

- Upload images and MP4 videos with resumable, chunked uploads
- Browse media in an infinite-scrolling library grouped by date
- Preview, download, and delete stored media
- Create albums, choose album covers, and add or remove media
- Encrypt original media, thumbnails, and album covers at rest
- Create and manage user accounts with user and admin roles
- Edit profiles and profile pictures
- Authenticate with short-lived JWT access tokens and refresh tokens
- Track per-user storage usage and limits
- Switch between light and dark themes

## Tech stack

### Backend

- Java 21
- Spring Boot 4
- Spring MVC for the REST API
- Spring Security with JWT authentication and BCrypt password hashing
- Spring Data JPA / Hibernate
- Microsoft SQL Server 2022
- JJWT for token handling
- MapStruct and Lombok
- Springdoc OpenAPI with Swagger UI, off by default. Set both `SPRINGDOC_API_DOCS_ENABLED` and `SPRINGDOC_SWAGGER_UI_ENABLED` to `true` to enable `/swagger-ui.html` and `/v3/api-docs`.
- Maven

### Frontend

- React 19 and TypeScript
- TanStack Start and TanStack Router
- TanStack Query for server state
- TanStack Form and Zod for forms and validation
- Zustand for client state
- Tailwind CSS 4
- Radix UI primitives, Lucide icons, and Sonner notifications
- Vite
- Biome for linting and formatting
- Bun for dependency management and scripts

### Infrastructure and testing

- Docker and Docker Compose
- Named Docker volumes for the database and stored media
- JUnit, Spring MVC Test, Spring Security Test, and H2

## Architecture

```text
Browser
  └── Caddy (:8003) — static frontend files + reverse proxy
        ├── /            Static TanStack Start / React SPA
        └── /api         Spring Boot REST API (:8080)
              ├── Microsoft SQL Server (:1433)
              └── Encrypted filesystem storage
```

The database stores users, roles, albums, media metadata, refresh tokens, and upload-session state. Binary media is stored on the filesystem and encrypted with a per-user key protected by the application master key.

## Getting started

### Prerequisites

- Docker with Docker Compose
- [Bun](https://bun.sh/) for the frontend

Java 21 is only required when running the backend outside Docker.

### Configure the application

Create the local environment file:

```bash
cp .env.example .env
```

Replace the example secrets in `.env`. Secure Base64 values can be generated with:

```bash
openssl rand -base64 32
```

Run the command separately for `JWT_SECRET` and `PHOTO_STORE_MASTER_KEY`. The SQL Server password must contain at least eight characters, including uppercase and lowercase letters, a number, and a symbol.

| Variable | Purpose |
| --- | --- |
| `DB_USERNAME` | SQL Server username used by the backend |
| `DB_PASSWORD` | SQL Server administrator password |
| `JWT_SECRET` | Key used to sign authentication tokens |
| `PHOTO_STORE_MASTER_KEY` | Key used to protect users' media-encryption keys |
| `MSSQL_PORT` | Optional host database port; defaults to `1433` |
| `VITE_API_BASE_URL` | Optional. Build-time API base URL baked into the frontend bundle. Defaults to same origin (`/api` via Caddy). Changing it requires rebuilding the Caddy image. |
| `SPRINGDOC_API_DOCS_ENABLED` | Optional. Set to `true` with the Swagger UI flag to publish OpenAPI JSON. Defaults to `false`. |
| `SPRINGDOC_SWAGGER_UI_ENABLED` | Optional. Set to `true` with the API docs flag to publish Swagger UI. Defaults to `false`. |

Keep the master key safe. Changing or losing it can make existing encrypted media unreadable.

## Running with Docker

### Production

From the repository root:

```bash
docker compose -f compose.prod.yaml up --build
```

This starts SQL Server, the packaged API, and Caddy, which serves the static frontend bundle and reverse-proxies `/api` to the API container. Open [http://localhost:8003](http://localhost:8003). Caddy is the only published HTTP origin. The UI and `/api` share that origin.

On the first visit, Photostore redirects to `/setup`, where the initial administrator account can be created.

The Caddy site address is hardcoded to `http://localhost:8003` in `caddy/Caddyfile`. To serve a real hostname (and Caddy's automatic HTTPS for it), edit that site address and restart the stack:

```bash
# in caddy/Caddyfile: photos.example.com { ... }
docker compose -f compose.prod.yaml up -d --build caddy
```

The frontend API base URL is baked in at image build time (`VITE_API_BASE_URL` build arg in `compose.prod.yaml`, defaulting to same origin). It is not read from the container environment at runtime.

`APP_PORT` is not published in production.

### Development

```bash
docker compose -f compose.dev.yaml up --build
```

This starts SQL Server, the backend with `./mvnw spring-boot:run` (hot-reloading from the mounted `src/`), and the Vite dev server. Open the frontend at [http://localhost:3000](http://localhost:3000) and the backend API directly at [http://localhost:8080](http://localhost:8080).

## Running bare metal

Requires Java 21, a local SQL Server instance with a `photostore` database, and [Bun](https://bun.sh/).

Configure `.env` as described above, then start the backend:

```bash
./mvnw spring-boot:run
```

The backend reads `.env` by default. To use another environment file:

```bash
ENV_FILE=.env.staging ./mvnw spring-boot:run
```

In a second terminal, start the frontend dev server:

```bash
cd frontend
bun install
bun --bun run dev
```

Open [http://localhost:3000](http://localhost:3000). On the first visit, Photostore redirects to `/setup`, where the initial administrator account can be created. The frontend proxies `/api` to `VITE_DEV_API_PROXY` when set, or to `http://localhost:8080`.


## API documentation

Swagger UI and the OpenAPI spec are off by default. Set both `SPRINGDOC_API_DOCS_ENABLED` and `SPRINGDOC_SWAGGER_UI_ENABLED` to `true` in `.env` to turn them on.

With the production stack, those paths are on the same origin:

- Swagger UI: [http://localhost:8003/swagger-ui.html](http://localhost:8003/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8003/v3/api-docs](http://localhost:8003/v3/api-docs)

With `compose.dev.yaml`, they stay on the published API:

- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## Project structure

```text
.
├── src/main/java/          Spring Boot application
├── src/main/resources/     Backend configuration and database schema
├── src/test/               Backend unit and integration tests
├── frontend/               TanStack Start application (static SPA in production)
├── docker/mssql/           SQL Server initialization script
├── caddy/                  Production Caddy image: static files + reverse proxy
├── compose.prod.yaml       SQL Server, packaged API, and Caddy
├── compose.dev.yaml        SQL Server, spring-boot:run, and Vite
├── Dockerfile              Backend production image
└── .env.example            Environment variable template
```
