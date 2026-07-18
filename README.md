# AITA — Sổ tay của Cô

Vietnamese math tutoring assistant. A teacher speaks or types a hard exercise;
Gemini returns a clear, step-by-step solution in Vietnamese so she can teach the
approach to students (grades 6–9). The interface is voice-first and built for
low-tech users: large type, high contrast, big touch targets, plain wording.

## Stack

| Part | Tech | Port |
| --- | --- | --- |
| `app/ai-ta-app` | Angular 21 (standalone, signals), Tailwind, Angular Material, ngx-translate, KaTeX | 4200 |
| `service/ai-ta-api` | NestJS 11, Prisma 5, Passport (Google OAuth2 + JWT), Google Generative AI SDK | 3000 |
| Database | PostgreSQL 16 | 5432 |

Auth is Google OAuth2 → JWT. The frontend calls the backend; the backend calls
Gemini and persists chat sessions in Postgres.

## Prerequisites

- Node.js 20+ and npm
- Docker (for local Postgres)
- A Google Gemini API key
- A Google OAuth2 client (Client ID + Secret) with redirect URI
  `http://localhost:3000/auth/google/callback`

---

## Backend — `service/ai-ta-api`

### 1. Install dependencies

```bash
cd service/ai-ta-api
npm install
```

### 2. Start the database

Postgres 16 in Docker, matching the connection string used below:

```bash
docker run -d --name ai-ta-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_ta \
  -p 5432:5432 \
  -v ai-ta-pgdata:/var/lib/postgresql/data \
  postgres:16
```

Manage it later with `docker start ai-ta-db` / `docker stop ai-ta-db`.

### 3. Configure environment

Create `service/ai-ta-api/.env` (git-ignored — never commit it):

```env
# Google OAuth2
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend origin (CORS + post-login redirect)
FRONTEND_URL=http://localhost:4200

# Auth — any long random string (e.g. `openssl rand -hex 32`)
JWT_SECRET=replace-with-random-secret

# Gemini
API_KEY=your-gemini-api-key
DEFAULT_MODEL=gemini-2.0-flash

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_ta?schema=public
```

All keys are required — the app reads them via `ConfigService.getOrThrow` and
fails fast at startup if any is missing.

### 4. Apply the database schema

```bash
npx prisma migrate deploy   # creates User, Session, Message tables
npx prisma generate         # generate the typed client
```

### 5. Run

```bash
npm run start:dev   # hot-reload dev server on http://localhost:3000
```

Health check: `curl http://localhost:3000/health` → `{"status":"ok","database":"up",...}`

Other scripts: `npm run build`, `npm run start:prod`, `npm run test`, `npm run lint`.

---

## Frontend — `app/ai-ta-app`

### 1. Install dependencies

```bash
cd app/ai-ta-app
npm install
```

### 2. Run

```bash
npm run start   # ng serve on http://localhost:4200
```

Development builds use `src/environments/environment.development.ts`, which
points `apiUrl` at `http://localhost:3000` — no extra config needed locally.

Other scripts: `npm run build`, `npm run test`, `npm run watch`.

### API URL in production

`src/environments/environment.ts` is generated at build time from the `API_URL`
environment variable (see `scripts/set-env.mjs`, run by the `prebuild` hook).
Set `API_URL` in your host (e.g. Vercel) to the deployed backend URL.

---

## Run the whole thing locally

1. Start Postgres (backend step 2).
2. Start the backend: `cd service/ai-ta-api && npm run start:dev`.
3. Start the frontend: `cd app/ai-ta-app && npm run start`.
4. Open `http://localhost:4200` and sign in with Google.

---

## Deployment

- **Backend → Render**: `render.yaml` (Blueprint) provisions the web service and
  a free Postgres. Set the `sync: false` secrets (`API_KEY`, `GOOGLE_*`,
  `FRONTEND_URL`) in the Render dashboard.
- **Frontend → Vercel**: `app/ai-ta-app/vercel.json` pins the build command,
  output directory, and SPA rewrites. Set root directory to `app/ai-ta-app` and
  the `API_URL` env var to the Render backend URL.

Update the Google OAuth client's redirect URI and JavaScript origins to match
the deployed URLs.

## Project layout

```
ai-ta/
├── app/ai-ta-app/        Angular frontend
│   ├── src/app/tutor/     main chat/tutor screen
│   ├── src/app/auth/      Google login + JWT handling
│   └── vercel.json        Vercel build config
├── service/ai-ta-api/    NestJS backend
│   ├── src/auth/          OAuth2 + JWT strategies
│   ├── src/gemini/        Gemini chat endpoint
│   ├── src/sessions/      chat history CRUD
│   ├── src/health/        health check endpoint
│   └── prisma/            schema + migrations
└── render.yaml           Render Blueprint (backend + db)
```
