# PromptOps

PromptOps is a prompt workspace for real iteration loops:

- edit a prompt draft
- run it immediately with live input
- save readable versions
- compare revisions
- run evals against saved versions

The app is split into a React frontend and a FastAPI backend, but it is wired for one shared deployment path.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy
- Database: SQLite locally, Postgres in production
- LLM provider: OpenRouter via environment variables

## Local setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload
```

The backend runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Environment variables

### Backend

See [D:\projects\prompt-ops-tool\backend\.env.example](D:\projects\prompt-ops-tool\backend\.env.example).

- `DATABASE_URL`
  - local default: `sqlite:///./promptops.db`
  - production: use a hosted Postgres connection string
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

### Frontend

See [D:\projects\prompt-ops-tool\frontend\.env.example](D:\projects\prompt-ops-tool\frontend\.env.example).

- `VITE_API_BASE_URL`
  - local default: `http://localhost:8000`
  - production default: `/api`

## Free hosting path

This repo is prepared for a free deployment path using:

1. Vercel for hosting
2. Neon Postgres for the production database
3. OpenRouter as the model gateway

### Why this setup

- Vercel can host the frontend and FastAPI backend from the same repo
- Neon gives you a free hosted Postgres database
- the backend already reads `DATABASE_URL`, so there is no sqlite persistence problem in production

### Vercel project shape

The root [D:\projects\prompt-ops-tool\vercel.json](D:\projects\prompt-ops-tool\vercel.json) uses Vercel Services:

- `web` service from `frontend`
- `api` service from `backend/main.py`

Requests to `/api/*` are routed to FastAPI. The frontend uses `/api` automatically in production.

### Production checklist

1. Push this repo to GitHub.
2. Create a free Neon Postgres database.
3. In Vercel, import the repo as a project.
4. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
5. Deploy.

### Recommended Neon connection string

Use the pooled Postgres connection string from Neon and keep `sslmode=require` in the URL.

## Current product behavior

- No fake data is required for the UI to work
- prompt lists, versions, test cases, eval results, and analytics all come from the backend
- the playground runs the exact draft content before you save a version

## Verification

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
python -m compileall backend\\main.py backend\\schemas.py backend\\database.py backend\\llm.py
```
