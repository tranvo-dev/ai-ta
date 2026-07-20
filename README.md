# AITA - Sổ tay của Cô 📚

> An AI math tutor assistant for Vietnamese teachers — speak or type a problem, get a clear step-by-step solution to share with your class.

Built for grades 6–9 math teachers. Voice-first, large text, high contrast. 

Available on both desktop and mobile.

## What it does

A teacher says or types a hard math problem. The app sends it to Gemini and returns a full Vietnamese explanation, step by step, ready to teach.

**Two ways to ask:**
- **Voice** — tap the green button, speak the problem out loud
- **Text** — type it in the box and hit Send

|                                      |                                             |                                                  |                                                 |                                               |
|--------------------------------------|---------------------------------------------|--------------------------------------------------|-------------------------------------------------|-----------------------------------------------|
| ![Home screen](screenshots/home.PNG) | ![Voice input](screenshots/input_voice.PNG) | ![Typing a question](screenshots/input_text.PNG) | ![Getting the answer](screenshots/response.PNG) | ![List of the question](screenshots/list.PNG) |


## Tech stack

| Part     | Tech                                              |
|----------|---------------------------------------------------|
| Frontend | Angular 21, Tailwind CSS, Angular Material, KaTeX |
| Backend  | NestJS 11, Prisma 5, Google Generative AI SDK     |
| Auth     | Google OAuth2 → JWT                               |
| Database | PostgreSQL 16                                     |

## Run it locally

### What you need

- Node.js 20+
- Docker (for Postgres)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A Google OAuth2 client — [create one here](https://console.cloud.google.com/apis/credentials)
  - Add redirect URI: `http://localhost:3000/auth/google/callback`
  - Add JavaScript origin: `http://localhost:4200`

### 1. Start the database

```bash
docker run -d --name ai-ta-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_ta \
  -p 5432:5432 \
  -v ai-ta-pgdata:/var/lib/postgresql/data \
  postgres:16
```
#### Manage the database
Start the database
```bash
docker start ai-ta-db
```
Stop the database
```bash
docker stop ai-ta-db
```

### 2. Set up the backend

```bash
cd service/ai-ta-api
npm install
```

Create `service/ai-ta-api/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

FRONTEND_URL=http://localhost:4200

JWT_SECRET=replace-with-any-long-random-string

API_KEY=your-gemini-api-key
DEFAULT_MODEL=gemini-2.0-flash

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_ta?schema=public
```

Apply the database schema:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the server:

```bash
npm run start:dev
```

Check it's running: 

```bash
curl http://localhost:3000/health
```

Response:
```json
{ 
  "status": "ok"
}
```

### 3. Set up the frontend

```bash
cd app/ai-ta-app
npm install
npm run start
```

### 4. Open the app

Go to [http://localhost:4200](http://localhost:4200) and sign in with Google.

## Deploy

| Service  | Where                                                               |
|----------|---------------------------------------------------------------------|
| Backend  | [Render](https://render.com) — `render.yaml` blueprint included     |
| Frontend | [Vercel](https://vercel.com) — `app/ai-ta-app/vercel.json` included |

**Render:** set `API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` as environment secrets in the dashboard.

**Vercel:** set root directory to `app/ai-ta-app`, add `API_URL` env var pointing to your Render backend URL.

After deploying, update your Google OAuth client's redirect URI and JavaScript origins to match the live URLs.

## Project layout

```
ai-ta/
├── app/ai-ta-app/        Angular frontend
│   ├── src/app/tutor/     main chat screen
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
