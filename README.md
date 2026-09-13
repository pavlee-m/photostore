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
- Springdoc OpenAPI with Swagger UI
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
  └── TanStack Start / React frontend (:3000)
        └── /api proxy
              └── Spring Boot REST API (:8080)
                    ├── Microsoft SQL Server (:1433)
                    └── Encrypted filesystem storage
```

The database stores users, roles, albums, media metadata, refresh tokens, and upload-session state. Binary media is stored on the filesystem and encrypted with a per-user key protected by the application master key.

## Getting started

### Prerequisites

- Docker with Docker Compose
- [Bun](https://bun.sh/) for the frontend

Java 21 is only required when running the backend outside Docker.

### 1. Configure the application

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
| `PHOTOSTORE_SITE` | Optional Caddy site address; defaults to `http://localhost`. Set a real hostname to enable automatic HTTPS. |

Keep the master key safe. Changing or losing it can make existing encrypted media unreadable.

### 2. Start production

From the repository root:

```bash
docker compose up --build
```

`compose.yaml` includes `compose.prod.yaml`. This starts SQL Server, the packaged API, the packaged frontend, and Caddy. Open [http://localhost](http://localhost). Caddy is the only published HTTP origin. The UI and `/api` share that origin.

On the first visit, Photostore redirects to `/setup`, where the initial administrator account can be created.

To serve a real hostname (and Caddy's automatic HTTPS for it):

```bash
PHOTOSTORE_SITE=photos.example.com docker compose up --build
```

`APP_PORT` is not published in production.

For the development images, including the Vite frontend at [http://localhost:3000](http://localhost:3000):

```bash
docker compose -f compose.dev.yaml up --build
```

### 3. Start the frontend

In another terminal:

```bash
cd frontend
bun install
bun --bun run dev
```

Open [http://localhost:3000](http://localhost:3000). On the first visit, Photostore redirects to `/setup`, where the initial administrator account can be created.

## Running without Docker

Start a local SQL Server instance with a `photostore` database, configure `.env`, and then run:

```bash
./mvnw spring-boot:run
```

The backend reads `.env` by default. To use another environment file:

```bash
ENV_FILE=.env.staging ./mvnw spring-boot:run
```

Start the frontend separately as described above. Vite proxies `/api` to `VITE_DEV_API_PROXY` when set, or to `http://localhost:8080`.

## Useful commands

### Backend

```bash
./mvnw test
./mvnw package
```

### Frontend

```bash
cd frontend
bun --bun run dev
bun --bun run build
bun --bun run lint
bun --bun run format
bun --bun run check
```

## API documentation

With the production stack running, interactive API documentation is on the same origin:

- Swagger UI: [http://localhost/swagger-ui.html](http://localhost/swagger-ui.html)
- OpenAPI JSON: [http://localhost/v3/api-docs](http://localhost/v3/api-docs)

With `compose.dev.yaml`, those paths stay on the published API:

- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

## Project structure

```text
.
├── src/main/java/          Spring Boot application
├── src/main/resources/     Backend configuration and database schema
├── src/test/               Backend unit and integration tests
├── frontend/               TanStack Start application
├── docker/mssql/           SQL Server initialization script
├── caddy/                  Production Caddyfile (public origin and path policy)
├── compose.yaml            Includes the production Compose file
├── compose.prod.yaml       SQL Server, packaged API, frontend, and Caddy
├── compose.dev.yaml        SQL Server, spring-boot:run, and Vite
├── Dockerfile              Backend production image
└── .env.example            Environment variable template
```
